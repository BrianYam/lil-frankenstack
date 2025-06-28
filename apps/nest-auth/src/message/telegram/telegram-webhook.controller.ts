import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';

@ApiTags('Telegram Webhook')
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger: CustomLoggerService;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(TelegramWebhookController.name);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Hide from Swagger as this is for Telegram's use
  @ApiOperation({ summary: 'Telegram webhook endpoint (internal use only)' })
  @ApiResponse({ status: 200, description: 'Update processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update format' })
  async handleWebhook(@Body() update: Update): Promise<void> {
    try {
      this.logger.debug(`Received webhook update: ${JSON.stringify(update)}`);

      // Process the update through Telegraf
      await this.bot.handleUpdate(update);

      this.logger.debug('Webhook update processed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to process webhook update: ${error.message}`,
        error.stack,
      );
      // Don't throw the error - Telegram will retry if we return an error status
      // Instead, log it and return successfully to prevent retry loops
    }
  }
}
