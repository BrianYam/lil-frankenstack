import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from 'src/auth/auth.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Refresh,
      ]), //tell passport to extract the jwt token from the cookie
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true, //tell the jwt strategy to pass the request object to the callback function, in this case the validate function
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    //this request is from passReqToCallback
    console.log('payload', payload.userId);
    console.log('request', request.cookies?.Refresh);
    return this.authService.verifyRefreshToken(
      request.cookies?.Refresh,
      payload.userId,
    );
  }
}
