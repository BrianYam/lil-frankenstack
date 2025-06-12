import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../database/schema/user.schema';
import { CurrentUser } from '../utils/decorators/current-user.decorator';
import { UserEmailJwtAuthGuard } from '../utils/guards/user-email-jwt-auth/user-email-jwt-auth.guard';
import { CreateUserRequestDto } from './dto/create-user.request.dto/create-user.request.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
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
    console.log('user', user);
    return this.usersService.findAll();
  }
}
