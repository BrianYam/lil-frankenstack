import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppController } from '@/app.controller';
import { UsersModule } from '@/users/users.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    // Import configs module globally
    ConfigModule.forRoot({ isGlobal: true }),
    // Add MongooseModule for MongoDB connection
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
