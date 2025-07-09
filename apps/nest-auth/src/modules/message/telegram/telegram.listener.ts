import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { SentinelAlertPayload, LogEvents } from '../../../../event/logs.events';
import telegramConfig from '@/configs/telegram.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { TelegramService } from '@/modules/message/telegram/telegram.service';
import { escapeMarkdownV2 } from '@/modules/message/utils/telegram.utils';

@Injectable()
export class TelegramListener {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly loggerFactory: LoggerFactory,
    @Inject(telegramConfig.KEY)
    private readonly telegramConfiguration: ConfigType<typeof telegramConfig>,
  ) {
    this.logger = this.loggerFactory.getLogger(TelegramListener.name);
  }

  //TODO if error has been sent a few times and it is similar in a short time then we can skip it
  @OnEvent(LogEvents.SENTINEL_ALERT)
  async onError(payload: SentinelAlertPayload) {
    this.logger.log(`Sentinel alert received: ${payload.message}`);

    // Format the message for better readability in Telegram using Markdown V2
    const formattedMessage = this.formatAlertForTelegram(payload);

    // Send the error message to the Telegram group
    try {
      const chatId = this.telegramConfiguration.groupChatId;
      if (!chatId) {
        this.logger.warn(
          'telegram.groupChatId is not set in configuration. Skipping message send.',
        );
        return;
      }

      // Use the formatted message sender
      await this.telegramService.sendFormattedMessage(chatId, formattedMessage);
    } catch (error) {
      this.logger.warn(
        `Failed to send alert message to Telegram: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Format the alert payload into a nicely structured Markdown V2 message for Telegram
   * Escapes special characters that need escaping in Markdown V2
   */
  private formatAlertForTelegram(payload: SentinelAlertPayload): string {
    // Use shared escapeMarkdownV2 utility
    // Get timestamp in more readable format
    const date = new Date(payload.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    // Build message parts with proper escaping
    const messageParts = [
      `*🚨 ALERT*`,
      ``,
      `*Message:* ${escapeMarkdownV2(payload.message)}`,
      `*Context:* ${escapeMarkdownV2(payload.context || 'Unknown')}`,
      `*Trace ID:* \`${escapeMarkdownV2(payload.traceId)}\``,
      `*Time:* ${escapeMarkdownV2(formattedDate)}`,
    ];

    // Add stack trace if available, but truncate if it's too long
    if (payload.trace) {
      const maxTraceLength = 800; // Telegram has message length limits
      let trace = payload.trace;

      if (trace.length > maxTraceLength) {
        trace = trace.substring(0, maxTraceLength) + '... (truncated)';
      }

      messageParts.push(
        ``,
        `*Stack Trace:*`,
        '```',
        escapeMarkdownV2(trace),
        '```',
      );
    }

    return messageParts.join('\n');
  }
}
