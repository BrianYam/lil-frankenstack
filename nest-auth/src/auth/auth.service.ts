import { randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '@/message/email/email.service';
import { ENV, TokenPayload, User } from '@/types';
import { UsersService } from '@/users/users.service';

const AUTHENTICATION = 'Authentication';
const REFRESH = 'Refresh';
const PRODUCTION = 'production';
const AUTHENTICATION_FE_COOKIE = 'Authentication-fe';
const AUTHENTICATED = 'authenticated';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  //TODO can even consider to move this to a cache service like Redis or NodeCache
  // or use a database to store the password reset tokens
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

  async validateUserByEmail(email: string, password: string): Promise<any> {
    try {
      this.logger.debug(`validateUserByEmail: ${email}`);
      const user = await this.usersService.getUser({
        email,
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const authenticated = await compare(password, user.password);
      if (!authenticated) {
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
    await this.usersService.updateUser({ id: user.id }, { refreshToken });
    this.logger.debug(`Refresh token: ${refreshToken}`);
    this.logger.debug(`User Id: ${user.id}`);

    //save the access token in the cookie
    response.cookie(AUTHENTICATION, accessToken, {
      expires: expiresAccessToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION, //only send cookie over HTTPS in production
    });

    // secure: true, //cookie is only sent over HTTPS
    //save the refresh token in the cookie
    // sameSite: 'none', //cookie is sent on every request
    response.cookie(REFRESH, refreshToken, {
      expires: expiresRefreshToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION, //only send cookie over HTTPS in production. Required for cross-origin cookies with SameSite=None
    });

    // secure: true, //cookie is only sent over HTTPS
    //if redirect is true, redirect to the AUTH_UI_REDIRECT, which is the frontend url
    // sameSite: 'none', //cookie is sent on every request
    if (redirect) {
      // Set a non-HTTP-only cookie that the frontend can read to detect auth state
      response.cookie(AUTHENTICATION_FE_COOKIE, AUTHENTICATED, {
        httpOnly: false, // Allow JavaScript access
        secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION,
        path: '/',
        sameSite:
          this.configService.get(ENV.NODE_ENV) === PRODUCTION ? 'none' : 'lax',
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
        throw new UnauthorizedException('Invalid token');
      }

      return await this.usersService.getUser({ id: userId });
    } catch (error) {
      this.logger.error(`Error verifying refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

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

  async resetPassword(
    resetDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Get token data from storage
    const tokenData = this.passwordResetTokens.get(resetDto.token);

    if (!tokenData) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    // Check if token has expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      this.passwordResetTokens.delete(resetDto.token);
      throw new UnauthorizedException('Password reset token has expired');
    }

    try {
      // Hash the new password
      const hashedPassword = await hash(resetDto.password, 10);

      // Update the user's password
      await this.usersService.updateUser(
        { id: tokenData.userId },
        { password: hashedPassword },
      );

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

      // TODO build in frontend
      // Build reset link (in a real app, this would point to the frontend)
      const resetLink = `${this.configService.getOrThrow(
        ENV.AUTH_UI_REDIRECT_URL,
      )}/reset-password?token=${resetToken}`;

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

  async logout(response: Response) {
    // Clear the authentication cookies
    response.clearCookie(AUTHENTICATION, {
      httpOnly: true,
      secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION,
    });
    response.clearCookie(REFRESH, {
      httpOnly: true,
      secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION,
    });

    this.logger.debug('User logged out, cookies cleared');

    return { message: 'Logged out successfully' };
  }
}
