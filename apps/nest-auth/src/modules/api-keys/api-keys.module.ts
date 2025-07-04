import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyAuthGuard } from '@/guards/api-key-auth.guard';
import { RepositoriesModule } from '@/modules/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, JwtModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyAuthGuard],
  exports: [ApiKeyService],
})
export class ApiKeysModule {}
