import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Response } from 'express';
import { AuthInput, AuthResult, ENV, SignInData, TokenPayload } from '@/types';
import { UsersService } from '@/users/users.service';
import { User } from 'src/database/schema/user.schema';

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
      console.error(error);
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

  //async login by email
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
      userId: typeof user._id === 'string' ? user._id : user._id.toHexString(),
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } =
      await this.generateTokens(tokenPayload);

    //since refreshToken is going to be a longer live token we want to implement a way that we can revoke it, in case it got compromised
    //so we want to store the refreshToken in the user's collection in the user database, and store it as a hash value as it is sensitive information
    //and when we validate the refreshToken we will check if the provided token matches the one stored in the user database
    //and if we want to revoke we can just delete the refreshToken from the user database
    await this.usersService.updateUser(
      { _id: user._id },
      { $set: { refreshToken: await hash(refreshToken, 10) } }, //hash the refreshToken before storing it in the user database, 10 is the saltRounds
    );
    this.logger.debug(`Refresh token: ${refreshToken}`);
    this.logger.debug(`User Id: ${user._id}`);

    //save the access token in the cookie
    response.cookie(AUTHENTICATION, accessToken, {
      expires: expiresAccessToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      // secure: true, //cookie is only sent over HTTPS
      secure: this.configService.get(ENV.NODE_ENV) === PRODUCTION, //only send cookie over HTTPS in production
      // sameSite: 'none', //cookie is sent on every request
    });

    //save the refresh token in the cookie
    response.cookie(REFRESH, refreshToken, {
      expires: expiresRefreshToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      // secure: true, //cookie is only sent over HTTPS
      secure: this.configService.get('NODE_ENV') === PRODUCTION, //only send cookie over HTTPS in production
      // sameSite: 'none', //cookie is sent on every request
    });

    //if redirect is true, redirect to the AUTH_UI_REDIRECT, which is the frontend url
    if (redirect) {
      response.redirect(
        this.configService.getOrThrow(ENV.AUTH_UI_REDIRECT_URL),
      );
    }
  }

  //async verify user refresh token
  async verifyRefreshToken(refreshToken: string, userId: string) {
    try {
      //find user by userId
      const user = await this.usersService.getUser({
        _id: userId,
      });

      // if user not found
      if (!user?.refreshToken) {
        throw new UnauthorizedException('Invalid token');
      }

      //compare refreshToken
      const authenticated = await compare(refreshToken, user.refreshToken);
      if (!authenticated) {
        throw new UnauthorizedException('Invalid token');
      }
      return user;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
