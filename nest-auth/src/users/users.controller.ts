import { Controller, Post, Body, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateUserRequestDto } from './dto/create-user.request.dto/create-user.request.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { UserEmailJwtAuthGuard } from '@/utils/guards/user-email-jwt-auth/user-email-jwt-auth.guard';
import { User } from '@/types';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserRequest: CreateUserRequestDto) {
    return this.usersService.createUser(createUserRequest);
  }

  @Get()
  @UseGuards(UserEmailJwtAuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUser(@CurrentUser() user: User) {
    this.logger.debug(`Current user: ${JSON.stringify(user)}`);
    return this.usersService.getAllUser();
  }
}
