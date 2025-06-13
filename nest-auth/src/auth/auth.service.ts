import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import {
  AuthInput,
  AuthResult,
  ENV,
  SignInData,
  TokenPayload,
  User,
} from '@/types';
import { UsersService } from '@/users/users.service';

const AUTHENTICATION = 'Authentication';
const REFRESH = 'Refresh';
const PRODUCTION = 'production';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult | null> {
    const user = await this.validateUser(input);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.signIn(user);

    // return {
    //   accessToken: 'fake-access-token',
    //   userId: user.userId,
    //   userName: user.username,
    // };
  }

  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.usersService.getUserByName(input.username);
    //if user exists and password matches
    if (user && user.password === input.password) {
      return { username: user.username, userId: user.userId };
    }
    return null;
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = { username: user.username, sub: user.userId };
    const accessToken = await this.jwtService.sign(tokenPayload);
    return {
      accessToken,
      userId: user.userId,
      userName: user.username,
    };
  }

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
      secure: this.configService.get('NODE_ENV') === PRODUCTION, //only send cookie over HTTPS in production. Required for cross-origin cookies with SameSite=None
    });

    // secure: true, //cookie is only sent over HTTPS
    //if redirect is true, redirect to the AUTH_UI_REDIRECT, which is the frontend url
    // sameSite: 'none', //cookie is sent on every request
    if (redirect) {
      response.redirect(
        this.configService.getOrThrow(ENV.AUTH_UI_REDIRECT_URL), //Redirect to the frontend application, welcome page
        //TODO is it possible that we can set cookies to the FE client link ?? Or it needs to be handled in the FE client side?
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
}
