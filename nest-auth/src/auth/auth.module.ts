import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalEmailStrategy } from './strategies/local.strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UserEmailJwtStrategy } from './strategies/user-email-jwt.strategy/user-email-jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy/jwt-refresh.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalEmailStrategy,
    UserEmailJwtStrategy,
    JwtRefreshStrategy,
  ],
  imports: [UsersModule, PassportModule, JwtModule],
})
export class AuthModule {}
