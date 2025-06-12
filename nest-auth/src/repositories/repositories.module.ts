import { Module } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class RepositoriesModule {}
