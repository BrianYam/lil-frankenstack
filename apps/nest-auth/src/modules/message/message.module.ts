import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [EmailModule, TelegramModule],
  exports: [EmailModule, TelegramModule],
})
export class MessageModule {}
