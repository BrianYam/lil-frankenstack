import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { ApiKeysModule } from '@/api-keys/api-keys.module';
import { AppController } from '@/app.controller';
import { DatabaseModule } from '@/database/database.module';
import { LoggerModule } from '@/logger/logger.module';
import { TraceModule } from '@/trace/trace.module';
import { UsersModule } from '@/users/users.module';
import { ReqResInterceptor } from '@/utils/interceptors/reqRes.interceptor';

@Module({
  imports: [
    // Import configs module globally
    ConfigModule.forRoot({ isGlobal: true }),
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
