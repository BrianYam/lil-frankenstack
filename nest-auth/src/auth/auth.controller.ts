import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '@/database/schema/user.schema';
import { CreateUserRequestDto } from '@/users/dto/create-user.request.dto/create-user.request.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { JwtRefreshAuthGuard } from '@/utils/guards/jwt-refresh-auth/jwt-refresh-auth.guard';
import { PassportLocalEmailGuard } from '@/utils/guards/passport-local/passport-local-email.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  //login/email
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
    //set cookies
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('user', user);
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
    console.log('user', user);
    await this.authService.loginByEmail(user, response);
  }
}
