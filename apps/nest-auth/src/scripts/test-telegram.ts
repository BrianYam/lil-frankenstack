import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TelegramService } from '@/modules/message/telegram/telegram.service';

/**
 * This script can be run to test Telegram message functionality.
 * Usage: pnpm ts-node src/scripts/test-telegram.ts
 */
async function bootstrap() {
  console.log('Initializing test script for Telegram messaging...');

  // Create NestJS application instance
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the TelegramService
    const telegramService = app.get(TelegramService);

    // Replace with your actual group chat ID
    const groupChatId =
      process.env.TELEGRAM_GROUP_CHAT_ID || '-your_group_chat_id';

    console.log(`Attempting to send message to chat ID: ${groupChatId}`);

    // Send a test message
    await telegramService.sendMessage(
      groupChatId,
      '🔔 Hello from your NestJS application! This is a test message.',
    );

    console.log('Test message sent successfully!');

    // Send a formatted message (using Markdown V2)
    await telegramService.sendFormattedMessage(
      groupChatId,
      '*Bold text*\n_Italic text_\n`Code`\n```\nCode block\n```',
    );

    console.log('Formatted test message sent successfully!');
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
