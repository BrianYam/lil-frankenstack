import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MessageModule } from '@/message/message.module';
import { RepositoriesModule } from '@/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, MessageModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
