import * as crypto from 'crypto';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { ApiKeyRepository } from '@/api-keys/api-key.repository';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { ApiKey, ENV } from '@/types';
import {
  CreateApiKeyDto,
  ApiKeyPayload,
  ApiKeyWithToken,
} from '@/types/api-keys.types';

@Injectable()
export class ApiKeyService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(ApiKeyService.name);
  }

  /**
   * Generate a secure random token for the API key
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash an API key for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const saltRounds = 10;
    return hash(token, saltRounds);
  }

  /**
   * Compare a plain token against a hashed token
   */
  private async compareToken(
    plainToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    return compare(plainToken, hashedToken);
  }

  /**
   * Create a JWT token from an API key
   */
  private createJwtFromApiKey(apiKey: ApiKey): string {
    const payload: ApiKeyPayload = {
      id: apiKey.id,
      clientName: apiKey.clientName,
      permissions: apiKey.permissions,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV.JWT_ACCESS_TOKEN_SECRET),
      expiresIn: apiKey.expiresAt
        ? Math.floor((new Date(apiKey.expiresAt).getTime() - Date.now()) / 1000)
        : '30d', // Default expiry of 30 days if no expiration is set
    });
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyWithToken> {
    const token = this.generateToken();
    const hashedToken = await this.hashToken(token);

    const apiKey = await this.apiKeyRepository.create({
      name: createApiKeyDto.name,
      description: createApiKeyDto.description || null,
      clientName: createApiKeyDto.clientName,
      key: hashedToken,
      expiresAt: createApiKeyDto.expiresAt || null,
      permissions: createApiKeyDto.permissions || [],
      userId,
    });

    // Generate JWT for the newly created API key
    const jwtToken = this.createJwtFromApiKey(apiKey);

    // Return the API key with the token (excluding the hashed key)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, ...apiKeyWithoutHash } = apiKey;
    return {
      ...apiKeyWithoutHash,
      token: jwtToken,
    };
  }

  /**
   * Get all API keys for a user
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    return this.apiKeyRepository.findAll();
  }

  /**
   * Get an API key by ID
   */
  async getApiKeyById(id: string): Promise<ApiKey | null> {
    return this.apiKeyRepository.findById(id);
  }

  /**
   * Validate an API key from the request header
   */
  async validateApiKey(token: string): Promise<ApiKey> {
    try {
      // First try to validate as JWT
      const decoded = this.jwtService.verify<ApiKeyPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // If verification passes, get the API key details
      const apiKey = await this.apiKeyRepository.findById(decoded.id);

      if (!apiKey?.isActive) {
        throw new UnauthorizedException('API key is invalid or inactive');
      }

      // If the API key has an expiration date and it has passed
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        throw new UnauthorizedException('API key has expired');
      }

      // Update the last used timestamp
      await this.apiKeyRepository.updateLastUsed(apiKey.id);

      return apiKey;
    } catch (jwtError) {
      // If JWT validation fails, try validating as a plain API key
      this.logger.debug(
        `JWT validation failed: ${jwtError.message}. Trying API key validation.`,
      );
      try {
        // Get all active API keys and check if one matches
        const apiKeys = await this.apiKeyRepository.findAll();

        for (const apiKey of apiKeys) {
          if (apiKey.isActive && (await this.compareToken(token, apiKey.key))) {
            // If API key has expired
            if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
              this.logger.debug(`API key found but expired: ${apiKey.id}`);
              continue;
            }

            // Update the last used timestamp
            await this.apiKeyRepository.updateLastUsed(apiKey.id);
            return apiKey;
          }
        }

        throw new UnauthorizedException('Invalid API key');
      } catch (error) {
        this.logger.error(`API key validation failed: ${error.message}`);
        throw new UnauthorizedException('Invalid API key');
      }
    }
  }

  /**
   * Regenerate an API key
   */
  async regenerateApiKey(id: string, userId: string): Promise<ApiKeyWithToken> {
    const apiKey = await this.apiKeyRepository.findById(id);

    if (!apiKey) {
      throw new UnauthorizedException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException('You cannot regenerate this API key');
    }

    const token = this.generateToken();
    const hashedToken = await this.hashToken(token);

    const updatedApiKey = await this.apiKeyRepository.update(id, {
      key: hashedToken,
      updatedAt: new Date(),
    });

    if (!updatedApiKey) {
      throw new InternalServerErrorException('Failed to update API key');
    }

    const jwtToken = this.createJwtFromApiKey(updatedApiKey);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, ...apiKeyWithoutHash } = updatedApiKey;
    return {
      ...apiKeyWithoutHash,
      token: jwtToken,
    };
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findById(id);

    if (!apiKey) {
      throw new UnauthorizedException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException('You cannot deactivate this API key');
    }

    const deactivatedKey = await this.apiKeyRepository.deactivate(id);
    if (!deactivatedKey) {
      throw new InternalServerErrorException('Failed to deactivate API key');
    }

    return deactivatedKey;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findById(id);

    if (!apiKey) {
      throw new UnauthorizedException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException('You cannot delete this API key');
    }

    const deletedKey = await this.apiKeyRepository.delete(id);
    if (!deletedKey) {
      throw new InternalServerErrorException('Failed to delete API key');
    }

    return deletedKey;
  }
}
