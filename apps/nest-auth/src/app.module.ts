import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { ApiKeysModule } from '@/api-keys/api-keys.module';
import { AppController } from '@/app.controller';
import { DatabaseModule } from '@/database/database.module';
import { LoggerModule } from '@/logger/logger.module';
import { UsersModule } from '@/users/users.module';
import { LoggingInterceptor } from '@/utils/interceptors/logging.interceptor';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
