import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { createTelegrafConfig } from './telegram.config.factory';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import generalConfig from '@/configs/general.config';
import telegramConfig from '@/configs/telegram.config';
import { TelegramListener } from '@/message/telegram/telegram.listener';
import { EventEmitterService } from 'event/event.emitter.service';

@Module({
  imports: [
    ConfigModule.forFeature(generalConfig),
    ConfigModule.forFeature(telegramConfig),
    TelegrafModule.forRootAsync({
      imports: [
        ConfigModule.forFeature(generalConfig),
        ConfigModule.forFeature(telegramConfig),
      ],
      inject: [generalConfig.KEY, telegramConfig.KEY],
      useFactory: createTelegrafConfig,
    }),
  ],
  controllers: [TelegramController, TelegramWebhookController],
  providers: [TelegramService, EventEmitterService, TelegramListener],
  exports: [TelegramService],
})
export class TelegramModule {}
