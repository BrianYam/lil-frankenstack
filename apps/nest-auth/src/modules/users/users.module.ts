import { Module } from '@nestjs/common';
import { UserDetailsController } from './user-details.controller';
import { UserDetailsService } from './user-details.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MessageModule } from '@/modules/message/message.module';
import { RepositoriesModule } from '@/modules/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, MessageModule],
  providers: [UsersService, UserDetailsService],
  exports: [UsersService, UserDetailsService],
  controllers: [UsersController, UserDetailsController],
})
export class UsersModule {}
