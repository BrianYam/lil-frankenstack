import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AUTH_STRATEGY, ENV, TokenPayload } from '@/types';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.JWT_REFRESH,
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Refresh,
      ]), //tell passport to extract the jwt token from the cookie
      secretOrKey: configService.getOrThrow<string>(
        ENV.JWT_REFRESH_TOKEN_SECRET,
      ),
      passReqToCallback: true, //tell the jwt strategy to pass the request object to the callback function, in this case the validate function
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    //this request is from passReqToCallback
    this.logger.debug(`payload: ${JSON.stringify(payload)}`);
    this.logger.debug(
      `request.cookies Refresh: ${JSON.stringify(request.cookies?.Refresh)}`,
    );
    return this.authService.verifyRefreshToken(
      request.cookies?.Refresh,
      payload.userId,
    );
  }
}
