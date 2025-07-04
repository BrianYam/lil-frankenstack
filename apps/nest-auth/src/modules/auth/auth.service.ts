import { randomBytes } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import authConfig from '@/configs/auth.config';
import generalConfig from '@/configs/general.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { EmailService } from '@/modules/message/email/email.service';
import { UsersService } from '@/modules/users/users.service';
import { TokenPayload, User } from '@/types';

const AUTHENTICATION = 'Authentication';
const REFRESH = 'Refresh';
const PRODUCTION = 'production';
const STAGING = 'staging';
const AUTHENTICATION_FE_COOKIE = 'Authentication-fe';
const AUTH_REDIRECT = 'auth-redirect';

@Injectable()
export class AuthService {
  private readonly logger: CustomLoggerService;

  //TODO consider to move this to a cache service like Redis or NodeCache
  // or use a database to store the password reset tokens
  //TODO (forgetEmail) to check, ensure it only storing 1 token per user, remove the old token when a new one is requested
  private readonly passwordResetTokens: Map<
    string,
    { userId: string; expiresAt: Date }
  > = new Map();

  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    @Inject(generalConfig.KEY)
    private readonly generalConfiguration: ConfigType<typeof generalConfig>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    // Get a dedicated logger instance with this class's context
    this.logger = this.loggerFactory.getLogger(AuthService.name);
  }

  // Helper method to check if environment requires HTTPS
  private isSecureEnvironment(): boolean {
    const env = this.generalConfiguration.nodeEnv;
    return env === PRODUCTION || env === STAGING;
  }

  async validateUserByEmail(email: string, password: string): Promise<any> {
    try {
      this.logger.debug(`validateUserByEmail: ${email}`);
      const user = await this.usersService.getUser({ email });
      if (!user) {
        this.logger.warn(`User not found for email: ${email}`);
        throw new UnauthorizedException('User not found');
      }

      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        this.logger.warn(`Invalid password for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
    } catch (error) {
      this.logger.errorAlert(
        `Authentication failed for email: ${email}, error: ${error.message}`,
        true,
        error.stack,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async generateTokens(
    tokenPayload: TokenPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.authConfiguration.jwtAccessTokenSecret,
      expiresIn: `${this.authConfiguration.jwtAccessTokenExpirationTimeMs}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.authConfiguration.jwtRefreshTokenSecret,
      expiresIn: `${this.authConfiguration.jwtRefreshTokenExpirationTimeMs}ms`,
    });

    return { accessToken, refreshToken };
  }

  async loginByEmail(user: User, response: Response, redirect = false) {
    //set expire time for access token
    const expiresAccessToken = new Date();
    expiresAccessToken.setMilliseconds(
      expiresAccessToken.getMilliseconds() +
        this.authConfiguration.jwtAccessTokenExpirationTimeMs,
    );

    //set expire time for refresh token
    const expiresRefreshToken = new Date();
    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getMilliseconds() +
        this.authConfiguration.jwtRefreshTokenExpirationTimeMs,
    );

    //create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } =
      await this.generateTokens(tokenPayload);

    //since refreshToken is going to be a longer live token we want to implement a way that we can revoke it, in case it got compromised
    //so we want to store the refreshToken in the user's collection in the user database, and store it as a hash value as it is sensitive information
    //and when we validate the refreshToken we will check if the provided token matches the one stored in the user database
    //and if we want to revoke we can just delete the refreshToken from the user database
    await this.usersService.updateUser(user.id, { refreshToken });
    this.logger.debug(`Refresh token: ${refreshToken}`);
    this.logger.debug(`User Id: ${user.id}`);

    // If this is not a redirect (regular login), set cookies directly
    if (!redirect) {
      //save the access token in the cookie
      response.cookie(AUTHENTICATION, accessToken, {
        expires: expiresAccessToken,
        httpOnly: true, //cookie is not accessible via JavaScript
        secure: this.isSecureEnvironment(), //only send cookie over HTTPS in production or staging
        sameSite: this.isSecureEnvironment() ? 'none' : 'lax', // Add sameSite='none' for cross-origin requests in secure environments
      });

      //save the refresh token in the cookie
      response.cookie(REFRESH, refreshToken, {
        expires: expiresRefreshToken,
        httpOnly: true, //cookie is not accessible via JavaScript
        secure: this.isSecureEnvironment(), //only send cookie over HTTPS in production or staging. Required for cross-origin cookies with SameSite=None
        sameSite: this.isSecureEnvironment() ? 'none' : 'lax', // Add sameSite='none' for cross-origin requests in secure environments
      });
    } else {
      // This is a redirect from OAuth - we need to use the token approach
      // Create a special auth token for cross-domain auth that will be valid for a brief period
      //TODO consider moving this to a function and rename tempAuthToken
      const tempAuthToken = this.jwtService.sign(
        { userId: user.id, purpose: AUTH_REDIRECT },
        {
          secret: this.authConfiguration.jwtAccessTokenSecret,
          expiresIn: '2m', // Short expiration, just enough for the redirect flow
        },
      );

      this.logger.debug(
        `Temporary auth token generated for redirect: ${tempAuthToken}`,
      );
      // Redirect to frontend with the token as a hash fragment
      // The frontend can then use this token to make an API call to complete authentication
      const redirectUrl = `${this.authConfiguration.authUiRedirectUrl}/auth-callback#token=${tempAuthToken}`;
      this.logger.debug(`Redirecting to: ${redirectUrl}`);
      response.redirect(redirectUrl);
    }
  }

  //async verify user refresh token
  async verifyRefreshToken(refreshToken: string, userId: string) {
    try {
      const user = await this.usersService.getUser({ id: userId });

      //call the repository to validate the token
      const isValid =
        await this.usersService.userRepository.validateRefreshToken(
          user,
          refreshToken,
        );

      if (!isValid) {
        this.logger.warn(
          `Invalid refresh token for user ID: ${userId}, token: ${refreshToken}`,
        );
        throw new UnauthorizedException('Invalid token');
      }

      return await this.usersService.getUser({ id: userId });
    } catch (error) {
      this.logger.error(`Error verifying refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async resetPassword(
    resetDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Get token data from storage
    const tokenData = this.passwordResetTokens.get(resetDto.token);

    if (!tokenData) {
      this.logger.warn(`Invalid password reset token: ${resetDto.token}.`);
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    // Check if token has expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      this.passwordResetTokens.delete(resetDto.token);
      this.logger.warn(
        `Password reset token expired for user ID: ${tokenData.userId}`,
      );
      throw new UnauthorizedException('Password reset token has expired');
    }

    try {
      // Update the user's password - let usersService handle the hashing
      await this.usersService.updateUser(tokenData.userId, {
        password: resetDto.password,
      });

      // Remove the used token
      this.passwordResetTokens.delete(resetDto.token);

      return { message: 'Password has been successfully reset' };
    } catch (error) {
      this.logger.error(`Error resetting password: ${error.message}`);
      throw new UnauthorizedException('Failed to reset password');
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    try {
      // Find the user with this email
      const user = await this.usersService.getUser({
        email: forgotPasswordDto.email,
      });

      if (!user) {
        // For security, don't reveal whether the email exists or not
        this.logger.warn(
          `User with email ${forgotPasswordDto.email} not found`,
        );
        return {
          message: 'The password reset link has been sent.',
        };
      }

      // Generate a secure random token
      const resetToken = randomBytes(32).toString('hex');

      // Store the token with expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      this.passwordResetTokens.set(resetToken, {
        userId: user.id,
        expiresAt,
      });

      /**
       * Builds a password reset link for the user
       *
       * @remarks
       * Using hash fragments (#) instead of query parameters (?) provides several security benefits:
       * - Hash fragments are not sent to the server in HTTP requests
       * - They don't appear in server logs or analytics
       * - They're not stored in browser history in the same way as query parameters
       * - They're not included in Referer headers when navigating away
       * - They provide better protection against token leakage
       *
       * Implementation example:
       * `/reset-password#token=${resetToken}` instead of `/reset-password?token=${resetToken}`
       *
       * The frontend must parse the token from location.hash instead of from URL parameters.
       *
       * @param {string} resetToken - The generated password reset token
       * @returns {string} The complete reset password URL
       */ const resetLink = `${this.authConfiguration.authUiRedirectUrl}/reset-password#token=${resetToken}`; //TODO handle path this in a constant or config ?

      // Send email with reset link
      await this.emailService.sendForgotPasswordEmail(
        user.email,
        resetToken,
        resetLink,
      );

      this.logger.debug(
        `Password reset requested for user: ${user.id}, token: ${resetToken}`,
      );

      return {
        message: 'The password reset link has been sent.',
      };
    } catch (error) {
      // Don't reveal whether the email exists or not for security reasons
      this.logger.error(`Error in forgot password request: ${error.message}`);
      return {
        message: 'The password reset link has been sent.', //TODO can we make this a constant or refactor to only do it once ?
      };
    }
  }

  /**
   * Verify a user email with a verification token
   * @param token - Email verification token
   * @returns Message indicating success
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      this.logger.debug(`Verifying email with token: ${token}`);
      return await this.usersService.verifyEmail(token);
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);
      throw error;
    }
  }

  async logout(response: Response) {
    // Clear the authentication cookies
    response.clearCookie(AUTHENTICATION, {
      httpOnly: true,
      secure: this.isSecureEnvironment(),
      sameSite: this.isSecureEnvironment() ? 'none' : 'lax',
    });
    response.clearCookie(REFRESH, {
      httpOnly: true,
      secure: this.isSecureEnvironment(),
      sameSite: this.isSecureEnvironment() ? 'none' : 'lax',
    });

    // Also clear the frontend cookie if it exists
    response.clearCookie(AUTHENTICATION_FE_COOKIE, {
      httpOnly: false,
      secure: this.isSecureEnvironment(),
      sameSite: this.isSecureEnvironment() ? 'none' : 'lax',
      path: '/',
    });

    this.logger.debug('User logged out, cookies cleared');

    return { message: 'Logged out successfully' };
  }

  async changePassword(
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      // Get the user with their current password hash
      const userWithPassword = await this.usersService.getUser({
        id: user.id,
      });

      if (!userWithPassword) {
        this.logger.warn(`User not found for ID: ${user.id}`);
        throw new UnauthorizedException('User not found');
      }

      // Verify the current password
      const isPasswordValid = await compare(
        changePasswordDto.currentPassword,
        userWithPassword.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Invalid current password for user: ${user.email}`);
        throw new UnauthorizedException('Current password is incorrect'); //TODO might wanna consider a more generic error message for security reasons
      }

      // Update the user's password
      await this.usersService.updateUser(user.id, {
        password: changePasswordDto.newPassword,
      });

      this.logger.debug(
        `Password changed successfully for user: ${user.email}`,
      );

      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error(`Error changing password: ${error.message}`);

      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Unauthorized access: ${error.message}`);
        throw error;
      }
      this.logger.error(`Failed to change password for user: ${user.email}`);
      throw new UnauthorizedException('Failed to change password');
    }
  }

  /**
   * Complete OAuth authentication process
   * This method is called by the frontend after being redirected from an OAuth provider
   * with a temporary authentication token
   *
   * @param token The temporary authentication token from the redirect
   * @param response Express response object to set cookies
   * @returns Authentication success message
   */
  async completeOAuthAuthentication(
    token: string,
    response: Response,
  ): Promise<{ message: string }> {
    try {
      // Verify the temporary token
      const decoded = this.jwtService.verify(token, {
        secret: this.authConfiguration.jwtAccessTokenSecret,
      });

      // Check if this is indeed an auth-redirect token
      if (!decoded || decoded.purpose !== AUTH_REDIRECT) {
        this.logger.warn('Invalid token purpose for OAuth completion');
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Get the user
      const user = await this.usersService.getUser({ id: decoded.userId });
      if (!user) {
        this.logger.warn(`User not found for ID: ${decoded.userId}`);
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Login the user (sets cookies) but don't redirect since we're already on the frontend
      await this.loginByEmail(user, response, false);

      return { message: 'Authentication completed successfully' };
    } catch (error) {
      this.logger.error(
        `OAuth authentication completion failed: ${error.message}`,
      );
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }

  /**
   * Request a password reset for a user
   * @deprecated Use the forgotPassword() method instead as it provides a more secure flow
   * @param user The user requesting password reset
   * @returns An object containing a message about the operation
   */
  async requestPasswordReset(user: User): Promise<{ message: string }> {
    try {
      // Generate a secure random token
      const resetToken = randomBytes(32).toString('hex');

      // Store the token with expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      this.passwordResetTokens.set(resetToken, {
        userId: user.id,
        expiresAt,
      });

      this.logger.debug(
        `Password reset requested for user: ${user.id}, token: ${resetToken}`,
      );

      // For development purposes, we'll just log the token
      this.logger.debug(
        `[DEV ONLY] Reset token for ${user.email}: ${resetToken}`,
      );

      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    } catch (error) {
      // Don't reveal whether the email exists or not for security reasons
      this.logger.error(`Error in password reset request: ${error.message}`);
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }
  }
}
