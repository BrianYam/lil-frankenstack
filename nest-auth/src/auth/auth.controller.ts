import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Res,
  Logger,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '@/types';
import { CreateUserRequestDto } from '@/users/dto/create-user.request.dto/create-user.request.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { SimpleApiKeyProtected } from '@/utils/decorators/simple-api-key-protector.decorator';
import { GoogleAuthGuard } from '@/utils/guards/google-auth/google-auth.guard';
import { JwtRefreshAuthGuard } from '@/utils/guards/jwt-refresh-auth/jwt-refresh-auth.guard';
import { PassportLocalEmailGuard } from '@/utils/guards/passport-local/passport-local-email.guard';

@ApiTags('auth')
@Controller('auth')
@SimpleApiKeyProtected()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login with email' })
  @ApiResponse({
    status: HttpStatus.NOT_IMPLEMENTED,
    description: 'Not implemented yet',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  // @ApiBody({ type: LoginInDto })
  @Post('login/email')
  @ApiBody({
    type: CreateUserRequestDto,
  })
  @UseGuards(PassportLocalEmailGuard)
  async loginWithEmail(
    @CurrentUser() user: User,
    // Inject Express response object with passthrough mode
    // This allows us to modify the response (set cookies, headers, etc.)
    // while still letting NestJS handle sending the final response
    // The actual cookie setting is done in authService.loginByEmail()
    @Res({ passthrough: true }) response: Response,
  ) {
    this.logger.debug(`loginWithEmail: ${JSON.stringify(user)}`);
    await this.authService.loginByEmail(user, response);
  }

  //refresh
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Refresh Token' })
  @ApiResponse({
    status: HttpStatus.NOT_IMPLEMENTED,
    description: 'Not implemented yet',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @CurrentUser() user: User,
    //set cookies
    @Res({ passthrough: true }) response: Response,
  ) {
    this.logger.debug(`refresh: ${JSON.stringify(user)}`);
    await this.authService.loginByEmail(user, response);
  }

  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect to Google login',
  })
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @ApiOperation({ summary: 'Google login callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Handle Google login callback',
  })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.logger.debug(`Google callback: ${JSON.stringify(response)}`);
    this.logger.debug(`Google user: ${JSON.stringify(user)}`);
    this.logger.debug(`Google callback: ${JSON.stringify(response)}`);
    await this.authService.loginByEmail(user, response, true);
  }
}

//TODO
// sign out
// reset password
// forgot password
