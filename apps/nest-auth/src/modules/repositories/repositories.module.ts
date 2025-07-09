import { Module } from '@nestjs/common';
import { ApiKeyRepository } from '@/modules/api-keys/api-key.repository';
import { UserDetailsRepository } from '@/modules/users/user-details.repository';
import { UserRepository } from '@/modules/users/user.repository';

@Module({
  providers: [UserRepository, UserDetailsRepository, ApiKeyRepository],
  exports: [UserRepository, UserDetailsRepository, ApiKeyRepository],
})
export class RepositoriesModule {}
