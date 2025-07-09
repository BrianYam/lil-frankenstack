import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from '@/modules/api-keys/api-key.service';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { FRANKENSTACK_API_KEY_HEADER } from '@/types';

/*
 * This guard checks for a custom API key in the request headers from DB
 */

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(ApiKeyAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header(FRANKENSTACK_API_KEY_HEADER);

    if (!apiKey) {
      this.logger.debug('API key missing from request');
      throw new UnauthorizedException('API key missing');
    }

    try {
      // Validate the API key using our service that checks the database
      const validApiKey = await this.apiKeyService.validateApiKey(apiKey);

      // Add the API key details to the request object for use in controllers
      request['apiKey'] = validApiKey;

      return true;
    } catch (error) {
      this.logger.debug(`Invalid API key: ${error.message}`);
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
