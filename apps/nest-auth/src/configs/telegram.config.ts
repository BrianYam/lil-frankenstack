import { registerAs } from '@nestjs/config';
import { getEnvVar, getEnvVarAsBoolean } from './utils/config.utils';

export default registerAs('telegram', () => ({
  botToken: getEnvVar('TELEGRAM_BOT_TOKEN'),
  groupChatId: getEnvVar('TELEGRAM_GROUP_CHAT_ID'),
  webhookUrl: getEnvVar('TELEGRAM_WEBHOOK_URL'),
  forcePolling: getEnvVarAsBoolean('TELEGRAM_FORCE_POLLING', false),
  webhookPath: getEnvVar('TELEGRAM_WEBHOOK_PATH', false, '/telegram/webhook'),
}));
