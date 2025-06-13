import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy/jwt-refresh.strategy';
import { LocalEmailStrategy } from './strategies/local.strategy/local.strategy';
import { UserEmailJwtStrategy } from './strategies/user-email-jwt.strategy/user-email-jwt.strategy';
import { GoogleStrategy } from '@/auth/strategies/google.strategy/google.strategy';
import googleOauthConfig from '@/configs/google-oauth.config';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalEmailStrategy,
    UserEmailJwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
  ],
  imports: [
    UsersModule,
    PassportModule,
    JwtModule,
    ConfigModule.forFeature(googleOauthConfig),
  ],
})
export class AuthModule {}
