import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { RepositoriesModule } from '@/repositories/repositories.module';
import { ENV } from '@/types';
import { ApiKeyAuthGuard } from '@/utils/guards/api-key-auth/api-key-auth.guard';

@Module({
  imports: [
    RepositoriesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(ENV.JWT_ACCESS_TOKEN_SECRET),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyAuthGuard],
  exports: [ApiKeyService],
})
export class ApiKeysModule {}
