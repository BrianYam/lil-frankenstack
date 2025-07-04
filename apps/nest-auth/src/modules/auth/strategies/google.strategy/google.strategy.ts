import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import googleOauthConfig from '@/configs/google-oauth.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { UsersService } from '@/modules/users/users.service';
import { AUTH_STRATEGY } from '@/types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY.GOOGLE_OAUTH,
) {
  private readonly logger: CustomLoggerService;
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private readonly usersService: UsersService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackUrl,
      scope: ['profile', 'email'],
    });
    this.logger = this.loggerFactory.getLogger(GoogleStrategy.name);
  }

  /**
   * Overrides the default authenticate method to add custom OAuth parameters.
   *
   * This method intercepts the Google OAuth authentication flow and adds the
   * 'prompt=select_account' parameter, which forces Google to display the
   * account selection screen even if the user is already logged in.
   *
   * @param req - The Express request object
   * @param options - Additional authentication options that may be passed
   * @returns The result of the parent authenticate method with custom options
   */
  authenticate(req: any, options?: any) {
    const authOptions = {
      ...options,
      prompt: 'select_account',
    };
    return super.authenticate(req, authOptions);
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
