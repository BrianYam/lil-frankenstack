import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Delete,
  Param,
  HttpCode,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateUserRequestDto } from './dto/create-user.request.dto';
import { UpdateUserRequestDto } from './dto/update-user.request.dto';
import { UsersService } from './users.service';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { User, UserRole } from '@/types';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Roles } from '@/utils/decorators/roles.decorator';
import { SimpleApiKeyProtected } from '@/utils/decorators/simple-api-key-protector.decorator';
import { RolesGuard } from '@/utils/guards/roles/roles.guard';
import { UserEmailJwtAuthGuard } from '@/utils/guards/user-email-jwt-auth/user-email-jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@SimpleApiKeyProtected()
export class UsersController {
  private readonly logger: CustomLoggerService;
  constructor(
    private readonly usersService: UsersService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UsersController.name);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserRequest: CreateUserRequestDto) {
    this.logger.debug(
      `Creating user with email: ${JSON.stringify(createUserRequest)}`,
    );
    return this.usersService.createUser(createUserRequest);
  }

  @Get()
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUser(@CurrentUser() user: User) {
    this.logger.debug(`Current user: ${JSON.stringify(user)}`);
    return this.usersService.getAllUser();
  }

  @Get('me')
  @UseGuards(UserEmailJwtAuthGuard)
  @ApiOperation({ summary: 'Get signed in user profile' })
  @ApiResponse({ status: 200, description: 'Return the current user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCurrentUser(@CurrentUser() user: User) {
    this.logger.debug(`Fetching profile for current user ID: ${user.id}`);
    return user; //TODO remove sentitive data later
  }

  @Patch(':id')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID to update' })
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    this.logger.debug(`Updating user with ID: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateUserDto)}`);
    this.logger.debug(
      `Request made by admin: ${currentUser.id} : ${currentUser.email}`,
    );

    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID to delete' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @HttpCode(200)
  async deleteUser(@Param('id') id: string) {
    this.logger.debug(`Deleting user with ID: ${id}`);
    return this.usersService.deleteUserWithResponse(id);
  }
}

//TODO invite admin, then will have isActive field, defualt true, for admin invite will be false, then need admin to activate password
