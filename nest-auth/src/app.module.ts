import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AppController } from '@/app.controller';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    // Import configs module globally
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
