import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FRANKENSTACK_API_KEY_HEADER } from '@/types';
import { SimpleApiKeyAuthGuard } from '@/utils/guards/simple-api-key-auth/simple-api-key-auth.guard';

export const API_KEY_PROTECTED = 'apiKeyProtected';

export function SimpleApiKeyProtected() {
  return applyDecorators(
    SetMetadata(API_KEY_PROTECTED, true),
    UseGuards(SimpleApiKeyAuthGuard),
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
