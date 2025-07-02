import { InternalServerErrorException } from '@nestjs/common';

export function getEnvVar(
  key: string,
  required = false,
  defaultValue?: string,
): string {
  const value = process.env[key];

  if (!value) {
    if (required && defaultValue === undefined) {
      throw new InternalServerErrorException(
        `Missing required environment variable: ${key}`,
      );
    }
    return defaultValue || '';
  }

  return value;
}

export function getEnvVarAsNumber(
  key: string,
  defaultValue?: number,
  required = false,
): number {
  const value = process.env[key];

  if (!value) {
    if (required) {
      throw new InternalServerErrorException(
        `Missing required environment variable: ${key}`,
      );
    }
    return defaultValue || 0;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new InternalServerErrorException(
      `Environment variable ${key} must be a valid number`,
    );
  }

  return parsed;
}

export function getEnvVarAsBoolean(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}
