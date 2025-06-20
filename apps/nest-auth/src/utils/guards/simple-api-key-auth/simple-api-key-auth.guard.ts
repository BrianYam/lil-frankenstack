import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ENV, FRANKENSTACK_API_KEY_HEADER } from '@/types';

@Injectable()
export class SimpleApiKeyAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header(FRANKENSTACK_API_KEY_HEADER);

    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }

    // Simple approach: check against environment variable
    const validApiKey = this.configService.get<string>(ENV.API_KEY);

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
