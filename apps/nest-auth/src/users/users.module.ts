import { Module } from '@nestjs/common';
import { UserDetailsService } from './user-details.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MessageModule } from '@/message/message.module';
import { RepositoriesModule } from '@/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, MessageModule],
  providers: [UsersService, UserDetailsService],
  exports: [UsersService, UserDetailsService],
  controllers: [UsersController],
})
export class UsersModule {}
