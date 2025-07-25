import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import authConfig from '@/configs/auth.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { UsersService } from '@/modules/users/users.service';
import { AUTH_STRATEGY, TokenPayload } from '@/types';

/*
 * Decode an incoming JWT token and validate it and allow the request to proceed
 * in our case we set the jwt token in the cookie, and we are using the cookie based jwt token
 * so the jwt is in the incoming cookie
 * and we are going to extract the jwt token from the cookie, we're going to use a library called cookie-parser
 * Note: This strategy is used to validate the jwt token that is in the cookie, a guard will this strategy and will be used to protect the routes
 */
@Injectable()
export class UserAuthJwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.USER_AUTH_JWT,
) {
  private readonly logger: CustomLoggerService;
  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    private readonly userService: UsersService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookies (web clients)
        (request: Request) => request?.cookies?.Authentication,
        // Then try to extract from Authorization header (mobile clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]), //tell passport to extract the jwt token from the cookie
      ignoreExpiration: false, //if the jwt token is expired, it will not allow the request to proceed
      secretOrKey: authConfiguration.jwtAccessTokenSecret,
    });
    this.logger = this.loggerFactory.getLogger(UserAuthJwtStrategy.name);
  }

  async validate(payload: TokenPayload) {
    this.logger.debug(`payload: ${JSON.stringify(payload)}`);
    return this.userService.getUser({ id: payload.userId });
  }
}
