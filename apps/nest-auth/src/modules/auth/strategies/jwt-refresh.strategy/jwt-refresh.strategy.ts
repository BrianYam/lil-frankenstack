import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import authConfig from '@/configs/auth.config';
import { AuthService } from '@/modules/auth/auth.service';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { AUTH_STRATEGY, TokenPayload } from '@/types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.JWT_REFRESH,
) {
  private readonly logger: CustomLoggerService;

  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    private readonly authService: AuthService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Refresh,
      ]), //tell passport to extract the jwt token from the cookie
      secretOrKey: authConfiguration.jwtRefreshTokenSecret,
      passReqToCallback: true, //tell the jwt strategy to pass the request object to the callback function, in this case the validate function
    });
    this.logger = this.loggerFactory.getLogger(JwtRefreshStrategy.name);
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
