import { apiKeysTable } from '@/modules/database/schema';
export const FRANKENSTACK_API_KEY_HEADER = 'Frankenstack-Api-Key';
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type NewApiKey = typeof apiKeysTable.$inferInsert;

export interface ApiKeyPayload {
  id: string;
  clientName: string;
  permissions: string[];
}

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  clientName: string;
  expiresAt?: Date;
  permissions?: string[];
}

export interface ApiKeyWithToken extends Omit<ApiKey, 'key'> {
  token: string;
}
