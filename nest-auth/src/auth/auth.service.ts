import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/database/schema/user.schema';
import { TokenPayload } from './token-payload.interface';
import { Response } from 'express'; // Import Response from express
import { hash } from 'bcryptjs'; // Import hash from bcryptjs

//define objects
//AuthInput
type AuthInput = { username: string; password: string };
//SignInData
type SignInData = { username: string; userId: number };
//AuthResult
type AuthResult = { accessToken: string; userId: number; userName: string };
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  //async function authenticate, input: AuthInput, output: AuthResult
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

  //async function validateUser, input: AuthInput, output: SignInData
  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.usersService.findUserByName(input.username);
    //if user exists and password matches
    if (user && user.password === input.password) {
      return { username: user.username, userId: user.userId };
    }
    return null;
  }

  //async function signIn, take argument SignInData, return AuthResult
  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = { username: user.username, sub: user.userId };
    const accessToken = await this.jwtService.sign(tokenPayload);
    return {
      accessToken,
      userId: user.userId,
      userName: user.username,
    };
  }

  //async validate user email and password
  async validateUserByEmail(email: string, password: string): Promise<any> {
    try {
      console.log('validateUserByEmail', email);
      const user = await this.usersService.findUser({
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

  //async login by email
  async loginByEmail(user: User, response: Response, redirect = false) {
    //set expire time for access token
    const expiresAccessToken = new Date();
    expiresAccessToken.setMilliseconds(
      expiresAccessToken.getMilliseconds() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS',
          ),
        ),
    );

    //set expire time for refresh token
    const expiresRefreshToken = new Date();
    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getMilliseconds() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS',
          ),
        ),
    );

    //create token payload
    const tokenPayload: TokenPayload = {
      userId: typeof user._id === 'string' ? user._id : user._id.toHexString(),
    };

    //create access token
    const accessToken = await this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME_MS')}ms`,
    });

    //create refresh token
    const refreshToken = await this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS')}ms`,
    });

    //since refreshToken is gonna be a longer live token we wanna implement a way that we can revoke it, incase it got compromised
    //so we wanna store the refreshToken in the user's collection in the user database, and store it as a hash value as it is sensitive information
    //and when we validate the refreshToken we will check if the provided token matchs the one stored in the user database
    //and if we wanna revoke we can just delete the refreshToken from the user database
    await this.usersService.updateUser(
      { _id: user._id },
      { $set: { refreshToken: await hash(refreshToken, 10) } }, //hash the refreshToken before storing it in the user database, 10 is the saltRounds
    );
    console.log('refreshToken', refreshToken);
    console.log('userId', user._id);

    //save the access token in the cookie
    response.cookie('Authentication', accessToken, {
      expires: expiresAccessToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      // secure: true, //cookie is only sent over HTTPS
      secure: this.configService.get('NODE_ENV') === 'production', //only send cookie over HTTPS in production
      // sameSite: 'none', //cookie is sent on every request
    });

    //save the refresh token in the cookie
    response.cookie('Refresh', refreshToken, {
      expires: expiresRefreshToken,
      httpOnly: true, //cookie is not accessible via JavaScript
      // secure: true, //cookie is only sent over HTTPS
      secure: this.configService.get('NODE_ENV') === 'production', //only send cookie over HTTPS in production
      // sameSite: 'none', //cookie is sent on every request
    });

    //if redirect is true, redirect to the AUTH_UI_REDIRECT, which is the frontend url
    if (redirect) {
      response.redirect(this.configService.getOrThrow('AUTH_UI_REDIRECT_URL'));
    }
  }

  //async verify user refresh token
  async verifyRefreshToken(refreshToken: string, userId: string) {
    try {
      //find user by userId
      const user = await this.usersService.findUser({
        _id: userId,
      });

      //if user not found
      // if user not found
      if (!user || !user.refreshToken) {
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
