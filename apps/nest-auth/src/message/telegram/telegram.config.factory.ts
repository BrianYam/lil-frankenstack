import { ConfigType } from '@nestjs/config';
import generalConfig from '@/configs/general.config';
import telegramConfig from '@/configs/telegram.config';
import { PRODUCTION, STAGING } from '@/types';

export function createTelegrafConfig(
  generalConfiguration: ConfigType<typeof generalConfig>,
  telegramConfiguration: ConfigType<typeof telegramConfig>,
) {
  const nodeEnv = generalConfiguration.nodeEnv;
  const isProductionLike = nodeEnv === PRODUCTION || nodeEnv === STAGING;
  const webhookUrl = telegramConfiguration.webhookUrl;
  const forceDevelopmentMode = telegramConfiguration.forcePolling;

  const baseConfig = {
    token: telegramConfiguration.botToken,
    include: [],
  };

  // Force polling mode if explicitly requested
  if (forceDevelopmentMode) {
    return {
      ...baseConfig,
      launchOptions: {
        polling: {
          timeout: 30,
          limit: 100,
          allowed_updates: ['message', 'callback_query'],
        },
      },
    };
  }

  // Use webhook in production/staging if URL is provided
  if (isProductionLike && webhookUrl) {
    return {
      ...baseConfig,
      launchOptions: {
        webhook: {
          domain: webhookUrl,
          hookPath: telegramConfiguration.webhookPath,
          // Let nestjs-telegraf handle webhook setup automatically
        },
      },
    };
  }

  // Development mode - use polling with better error handling
  return {
    ...baseConfig,
    launchOptions: {
      polling: {
        timeout: 30,
        limit: 100,
        allowed_updates: ['message', 'callback_query'],
      },
    },
  };
}
