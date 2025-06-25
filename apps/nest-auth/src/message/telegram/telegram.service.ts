import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { Message } from 'telegraf/types';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';

//TODO to store group chat ID in db
// so based on different context we can send messages to different groups

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger: CustomLoggerService;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(TelegramService.name);
  }
  /**
   * Setup event handlers when the module initializes
   */
  async onModuleInit() {
    // Setup handler to log incoming updates (helpful for getting chat IDs)
    this.bot.use(async (ctx, next) => {
      if (ctx.chat) {
        this.logger.log(
          `Received update from chat ID: ${ctx.chat.id}, Type: ${ctx.chat.type}`,
        );
      }
      await next();
    });

    // Register command handler for /chatid command
    this.bot.command('chatid', (ctx) => {
      ctx.reply(`Chat ID: ${ctx.chat.id}\nChat Type: ${ctx.chat.type}`);
    });
  }

  /**
   * Send a message to a specific Telegram chat
   * @param chatId The ID of the chat to send the message to
   * @param message The message to send
   * @returns Promise resolving to the message that was sent
   */
  async sendMessage(
    chatId: string | number,
    message: string,
  ): Promise<Message> {
    try {
      const result = await this.bot.telegram.sendMessage(chatId, message);
      this.logger.log(`Message sent to chat ${chatId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send message to chat ${chatId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send a message to a list of chat IDs
   * @param chatIds Array of chat IDs to send the message to
   * @param message The message to send
   * @returns Promise resolving to an array of results
   */
  async broadcastMessage(
    chatIds: (string | number)[],
    message: string,
  ): Promise<Message[]> {
    try {
      const results = await Promise.all(
        chatIds.map((chatId) => this.sendMessage(chatId, message)),
      );
      this.logger.log(`Message broadcast to ${chatIds.length} chats`);
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to broadcast message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send a message with formatting (Markdown V2)
   * @param chatId The ID of the chat to send the message to
   * @param message The message to send (can include Markdown V2 formatting)
   * @returns Promise resolving to the message that was sent
   */
  async sendFormattedMessage(
    chatId: string | number,
    message: string,
  ): Promise<Message> {
    try {
      const result = await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'MarkdownV2',
      });
      this.logger.log(`Formatted message sent to chat ${chatId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send formatted message to chat ${chatId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  sendDummyError() {
    try {
      throw new Error('This is a dummy error for testing purposes');
    } catch (error) {
      this.logger.errorAlert(
        `Dummy error occurred: ${error.message}`,
        true,
        error.stack,
      );
    }
  }
}
