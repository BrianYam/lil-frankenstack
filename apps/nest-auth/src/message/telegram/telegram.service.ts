import {
  Injectable,
  OnModuleInit,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { Message } from 'telegraf/types';
import generalConfig from '@/configs/general.config';
import telegramConfig from '@/configs/telegram.config';
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
    @Inject(generalConfig.KEY)
    private readonly generalConfiguration: ConfigType<typeof generalConfig>,
    @Inject(telegramConfig.KEY)
    private readonly telegramConfiguration: ConfigType<typeof telegramConfig>,
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

    // Log the current mode for debugging
    this.logCurrentMode();
  }

  /**
   * Log the current bot mode (webhook vs polling) for debugging
   */
  private logCurrentMode(): void {
    const { nodeEnv } = this.generalConfiguration;
    const { webhookUrl, webhookPath, forcePolling } =
      this.telegramConfiguration;
    const isProductionLike = nodeEnv === 'production' || nodeEnv === 'staging';

    this.logger.log(
      `Current environment: ${nodeEnv} (${isProductionLike ? 'Production-like' : 'Development'})`,
    );
    this.logger.log(
      `Webhook URL: ${webhookUrl || 'Not configured (using polling)'}`,
    );
    this.logger.log(
      `Force development mode: ${forcePolling ? 'Enabled' : 'Disabled'}`,
    );

    if (forcePolling) {
      this.logger.log('Bot initialized in FORCED POLLING mode');
      return;
    }

    if (isProductionLike && webhookUrl) {
      this.logger.log(
        `Bot initialized in WEBHOOK mode (${nodeEnv}): ${webhookUrl}${webhookPath}`,
      );
      return;
    }

    this.logger.log('Bot initialized in POLLING mode (development)');
  }

  /**
   * Remove webhook and switch back to polling (useful for development)
   */
  async removeWebhook(): Promise<void> {
    try {
      await this.bot.telegram.deleteWebhook();
      this.logger.log('Webhook removed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to remove webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get current webhook information
   */
  async getWebhookInfo(): Promise<any> {
    try {
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      this.logger.log(`Current webhook info: ${JSON.stringify(webhookInfo)}`);
      return webhookInfo;
    } catch (error) {
      this.logger.error(
        `Failed to get webhook info: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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
      throw new InternalServerErrorException(
        'This is a dummy error for testing purposes',
      );
    } catch (error) {
      this.logger.errorAlert(
        `Dummy error occurred: ${error.message}`,
        true,
        error.stack,
      );
    }
  }
}
