import fs from 'node:fs';
import path from 'node:path';
import { NotFoundException } from '@nestjs/common';
import { DatabaseConfig, DbEnvVars } from '@/types';

const getEnvVariable = (key: keyof DbEnvVars): string => {
  const value = process.env[key];
  if (!value) {
    throw new NotFoundException(
      `Missing required environment variable: ${key}`,
    );
  }
  return value;
};

export const getDatabaseConfig = (): DatabaseConfig => {
  const required: (keyof DbEnvVars)[] = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const config = required.reduce(
    (acc, key) => ({
      ...acc,
      [key]: getEnvVariable(key),
    }),
    {} as Record<keyof DbEnvVars, string>,
  );

  const connectionString = `postgresql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;

  const nodeEnv = process.env.NODE_ENV;

  // const isProdOrStaging = ['production', 'staging'].includes(nodeEnv || '');
  const isProdOrStaging = ['production'].includes(nodeEnv || ''); //TODO remove staging

  const ssl = isProdOrStaging
    ? {
        ca: fs.readFileSync(path.resolve('cert/rds-ca-cert.pem'), 'utf-8'),
        rejectUnauthorized: true,
      }
    : undefined;

  console.info(
    `SSL configuration ${
      isProdOrStaging
        ? 'enabled with self-signed certificate allowed'
        : 'disabled'
    }.`,
  );

  return {
    connectionString,
    ssl,
    ...config,
    DB_PORT: parseInt(config.DB_PORT, 10),
  };
};
