import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { AppController } from '@/app.controller';
import authConfig from '@/configs/auth.config';
import emailConfig from '@/configs/email.config';
import generalConfig from '@/configs/general.config';
import googleOauthConfig from '@/configs/google-oauth.config';
import telegramConfig from '@/configs/telegram.config';
import { ReqResInterceptor } from '@/interceptors/reqRes.interceptor';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { LoggerModule } from '@/modules/logger/logger.module';
import { RepositoriesModule } from '@/modules/repositories/repositories.module';
import { TraceModule } from '@/modules/trace/trace.module';
import { UsersModule } from '@/modules/users/users.module';
import { LlmModule } from './modules/llm/llm.module';

@Module({
  imports: [
    // Import configs module globally with all configurations
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        authConfig,
        generalConfig,
        googleOauthConfig,
        emailConfig,
        telegramConfig,
      ],
    }),
    LoggerModule,
    UsersModule,
    AuthModule,
    RepositoriesModule,
    DatabaseModule,
    ApiKeysModule,
    TraceModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
    LlmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ReqResInterceptor,
    },
  ],
})
export class AppModule {}
