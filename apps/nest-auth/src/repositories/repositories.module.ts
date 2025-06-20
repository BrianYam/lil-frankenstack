import { Module } from '@nestjs/common';
import { ApiKeyRepository } from '@/api-keys/api-key.repository';
import { UserRepository } from '@/users/user.repository';

@Module({
  providers: [UserRepository, ApiKeyRepository],
  exports: [UserRepository, ApiKeyRepository],
})
export class RepositoriesModule {}
