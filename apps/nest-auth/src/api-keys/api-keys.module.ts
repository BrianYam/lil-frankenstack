import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { RepositoriesModule } from '@/repositories/repositories.module';
import { ApiKeyAuthGuard } from '@/utils/guards/api-key-auth/api-key-auth.guard';

@Module({
  imports: [RepositoriesModule, JwtModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyAuthGuard],
  exports: [ApiKeyService],
})
export class ApiKeysModule {}
