import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy/jwt-refresh.strategy';
import { LocalEmailStrategy } from './strategies/local.strategy/local.strategy';
import { GoogleStrategy } from '@/auth/strategies/google.strategy/google.strategy';
import { UserAuthJwtStrategy } from '@/auth/strategies/user-auth-jwt.strategy/user-auth-jwt.strategy';
import { MessageModule } from '@/message/message.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalEmailStrategy,
    UserAuthJwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
  ],
  imports: [UsersModule, PassportModule, JwtModule, MessageModule],
})
export class AuthModule {}
