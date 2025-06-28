import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  groupChatId: process.env.TELEGRAM_GROUP_CHAT_ID,
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  forcePolling: process.env.TELEGRAM_FORCE_POLLING === 'true',
  webhookPath: process.env.TELEGRAM_WEBHOOK_PATH || '/telegram/webhook',
}));
