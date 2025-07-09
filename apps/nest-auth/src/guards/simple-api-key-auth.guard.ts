import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import authConfig from '@/configs/auth.config';
import { FRANKENSTACK_API_KEY_HEADER } from '@/types';

// Define OAuth login routes as a constant array for easier maintenance
const OAUTH_LOGIN_ROUTES = [
  '/auth/google/login',
  '/auth/google/callback',
  '/auth/facebook/login',
];

@Injectable()
export class SimpleApiKeyAuthGuard implements CanActivate {
  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header(FRANKENSTACK_API_KEY_HEADER);

    const path = request.path;

    // Check if the current path is an OAuth login route
    const isOAuthLoginRoute = OAUTH_LOGIN_ROUTES.includes(path);

    if (isOAuthLoginRoute) {
      return true; // Skip API key check for OAuth login routes
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }

    // Simple approach: check against environment variable
    const validApiKey = this.authConfiguration.apiKey;

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
