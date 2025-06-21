import { randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '@/message/email/email.service';
import { ENV, TokenPayload, User } from '@/types';
import { UsersService } from '@/users/users.service';

const AUTHENTICATION = 'Authentication';
const REFRESH = 'Refresh';
const PRODUCTION = 'production';
const STAGING = 'staging';
const AUTHENTICATION_FE_COOKIE = 'Authentication-fe';
const AUTHENTICATED = 'authenticated';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  //TODO can even consider to move this to a cache service like Redis or NodeCache
  // or use a database to store the password reset tokens
  //TODO also check, we need to ensure we are only storing 1 token per user, so we can remove the old one when a new one is requested
  private readonly passwordResetTokens: Map<
    string,
    { userId: string; expiresAt: Date }
  > = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // Helper method to check if environment requires HTTPS
  private isSecureEnvironment(): boolean {
    const env = this.configService.get(ENV.NODE_ENV);
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
      this.logger.error(
        `Authentication failed for email: ${email}, error: ${error.message}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async generateTokens(
    tokenPayload: TokenPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>(
        ENV.JWT_ACCESS_TOKEN_SECRET,
      ),
      expiresIn: `${this.configService.getOrThrow<string>(ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS)}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>(
        ENV.JWT_REFRESH_TOKEN_SECRET,
      ),
      expiresIn: `${this.configService.getOrThrow<string>(ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS)}ms`,
    });

    return { accessToken, refreshToken };
  }

  async loginByEmail(user: User, response: Response, redirect = false) {
    //set expire time for access token
    const expiresAccessToken = new Date();
    expiresAccessToken.setMilliseconds(
      expiresAccessToken.getMilliseconds() +
        parseInt(
          this.configService.getOrThrow<string>(
            ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS,
          ),
        ),
    );

    //set expire time for refresh token
    const expiresRefreshToken = new Date();
    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getMilliseconds() +
        parseInt(
          this.configService.getOrThrow<string>(
            ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS,
          ),
        ),
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

    //save the access token in the cookie
    response.cookie(AUTHENTICATION, accessToken, {
      expires: expiresAccessToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      secure: this.isSecureEnvironment(), //only send cookie over HTTPS in production or staging
    });

    // secure: true, //cookie is only sent over HTTPS
    //save the refresh token in the cookie
    // sameSite: 'none', //cookie is sent on every request
    response.cookie(REFRESH, refreshToken, {
      expires: expiresRefreshToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      secure: this.isSecureEnvironment(), //only send cookie over HTTPS in production or staging. Required for cross-origin cookies with SameSite=None
    });

    // secure: true, //cookie is only sent over HTTPS
    //if redirect is true, redirect to the AUTH_UI_REDIRECT, which is the frontend url
    // sameSite: 'none', //cookie is sent on every request
    if (redirect) {
      // Set a non-HTTP-only cookie that the frontend can read to detect auth state
      response.cookie(AUTHENTICATION_FE_COOKIE, AUTHENTICATED, {
        httpOnly: false, // Allow JavaScript access
        secure: this.isSecureEnvironment(),
        path: '/',
        sameSite: this.isSecureEnvironment() ? 'none' : 'lax',
      });

      // Redirect to frontend
      response.redirect(
        this.configService.getOrThrow(ENV.AUTH_UI_REDIRECT_URL),
      );
    }
  }

  //async verify user refresh token
  async verifyRefreshToken(refreshToken: string, userId: string) {
    try {
      //call the repository to validate the token
      const isValid =
        await this.usersService.userRepository.validateRefreshToken(
          userId,
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
       */ const resetLink = `${this.configService.getOrThrow(
        ENV.AUTH_UI_REDIRECT_URL,
      )}/reset-password#token=${resetToken}`; //TODO handle path this in a constant or config ?

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
    });
    response.clearCookie(REFRESH, {
      httpOnly: true,
      secure: this.isSecureEnvironment(),
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
   * DEPRECATES GOES HERE !
   */

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

      //TODO
      // In a production environment, you would send an email with the reset link
      // Example: await this.emailService.sendPasswordResetEmail(user.email, resetToken);

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
