import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AUTH_STRATEGY, ENV, TokenPayload } from '@/types';
import { UsersService } from 'src/users/users.service';

/*
 * Decode an incoming JWT token and validate it and allow the request to proceed
 * in our case we set the jwt token in the cookie, and we are using the cookie based jwt token
 * so the jwt is in the incoming cookie
 * and we are going to extract the jwt token from the cookie, we're going to use a library called cookie-parser
 * Note: This strategy is used to validate the jwt token that is in the cookie, a guard will this strategy and will be used to protect the routes
 */
@Injectable()
export class UserEmailJwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.USER_EMAIL_JWT,
) {
  private readonly logger = new Logger(PassportStrategy.name);
  constructor(
    configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Authentication,
      ]), //tell passport to extract the jwt token from the cookie
      ignoreExpiration: false, //if the jwt token is expired, it will not allow the request to proceed
      secretOrKey: configService.getOrThrow<string>(
        ENV.JWT_ACCESS_TOKEN_SECRET,
      ),
    });
  }

  async validate(payload: TokenPayload) {
    this.logger.debug(`payload: ${JSON.stringify(payload)}`);
    return this.userService.getUser({ id: payload.userId });
  }
}
