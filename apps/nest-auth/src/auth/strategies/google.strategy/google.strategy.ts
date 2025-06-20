import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import googleOauthConfig from '@/configs/google-oauth.config';
import { AUTH_STRATEGY } from '@/types';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.GOOGLE_OAUTH,
) {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackUrl,
      scope: ['profile', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    this.logger.debug(`Google profile: ${JSON.stringify(profile)}`);
    return this.usersService.getOrCreateUser(
      {
        email: profile.emails[0]?.value,
        //TODO get other details from profile
        // firstName: profile.name.givenName,
        // lastName: profile.name.familyName,
        // avatarUrl: profile.photos[0].value,
        password: '',
      },
      true,
    );
  }
}
