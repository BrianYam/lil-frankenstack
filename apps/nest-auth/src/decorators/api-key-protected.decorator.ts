import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '@/guards/api-key-auth.guard';
import { FRANKENSTACK_API_KEY_HEADER } from '@/types';

export const API_KEY_PROTECTED = 'apiKeyProtected';

export function ApiKeyProtected() {
  return applyDecorators(
    SetMetadata(API_KEY_PROTECTED, true),
    UseGuards(ApiKeyAuthGuard),
    ApiBearerAuth('API key'),
    ApiHeader({
      name: FRANKENSTACK_API_KEY_HEADER,
      description: 'API key for protected endpoints',
      required: true,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing API key',
    }),
  );
}
