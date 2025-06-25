import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramListener } from '@/message/telegram/telegram.listener';
import { EventEmitterService } from 'event/event.emitter.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN'), //TODO build config
        include: [],
      }),
    }),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, EventEmitterService, TelegramListener],
  exports: [TelegramService],
})
export class TelegramModule {}
