import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { EventEmitterService } from '../../../../event/event.emitter.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { createTelegrafConfig } from './telegram.config.factory';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import generalConfig from '@/configs/general.config';
import telegramConfig from '@/configs/telegram.config';
import { TelegramListener } from '@/modules/message/telegram/telegram.listener';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [generalConfig.KEY, telegramConfig.KEY],
      useFactory: createTelegrafConfig,
    }),
  ],
  controllers: [TelegramController, TelegramWebhookController],
  providers: [TelegramService, EventEmitterService, TelegramListener],
  exports: [TelegramService],
})
export class TelegramModule {}
