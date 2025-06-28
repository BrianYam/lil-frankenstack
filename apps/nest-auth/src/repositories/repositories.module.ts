import { Module } from '@nestjs/common';
import { ApiKeyRepository } from '@/api-keys/api-key.repository';
import { UserDetailsRepository } from '@/users/user-details.repository';
import { UserRepository } from '@/users/user.repository';

@Module({
  providers: [UserRepository, UserDetailsRepository, ApiKeyRepository],
  exports: [UserRepository, UserDetailsRepository, ApiKeyRepository],
})
export class RepositoriesModule {}
