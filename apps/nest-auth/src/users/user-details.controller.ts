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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateUserDetailsRequestDto } from './dto/create-user-details.request.dto';
import { UpdateUserDetailsRequestDto } from './dto/update-user-details.request.dto';
import { UserDetailsService } from './user-details.service';
import { CustomLoggerService } from '@/logger/custom-logger.service';
import { LoggerFactory } from '@/logger/logger-factory.service';
import { User, UserRole } from '@/types';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { Roles } from '@/utils/decorators/roles.decorator';
import { SimpleApiKeyProtected } from '@/utils/decorators/simple-api-key-protector.decorator';
import { RolesGuard } from '@/utils/guards/roles/roles.guard';
import { UserEmailJwtAuthGuard } from '@/utils/guards/user-email-jwt-auth/user-email-jwt-auth.guard';

@ApiTags('users')
@Controller('users/details') // Removed :userId from the base path
@SimpleApiKeyProtected()
export class UserDetailsController {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly userDetailsService: UserDetailsService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(UserDetailsController.name);
  }

  @Post()
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Create new user details for the current user' })
  @ApiBody({ type: CreateUserDetailsRequestDto })
  @ApiResponse({
    status: 201,
    description: 'The user details have been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() createUserDetailsRequest: CreateUserDetailsRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    const userId = currentUser.id;
    this.logger.debug(
      `Creating user details for user ID: ${userId} by user: ${currentUser.id}`,
    );
    return this.userDetailsService.create(userId, createUserDetailsRequest);
  }

  @Get()
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all user details for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all user details for the current user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllUserDetails(@CurrentUser() currentUser: User) {
    const userId = currentUser.id;
    this.logger.debug(
      `Getting all user details for user ID: ${userId} by user: ${currentUser.id}`,
    );
    return this.userDetailsService.getByUserId(userId);
  }

  @Get('default')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get default user details for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return the default user details for the current user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Default user details not found.' })
  async getDefaultUserDetails(@CurrentUser() currentUser: User) {
    const userId = currentUser.id;
    this.logger.debug(
      `Getting default user details for user ID: ${userId} by user: ${currentUser.id}`,
    );
    return this.userDetailsService.getDefaultByUserId(userId);
  }

  @Get(':id')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get user details by ID for the current user' })
  @ApiParam({ name: 'id', description: 'ID of the user details' })
  @ApiResponse({
    status: 200,
    description: 'Return the user details by ID.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User details not found.' })
  async getUserDetailsById(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const userId = currentUser.id;
    this.logger.debug(
      `Getting user details with ID: ${id} for user ID: ${userId} by user: ${currentUser.id}`,
    );
    // Additional check to ensure the user details belong to the specified userId
    const userDetails = await this.userDetailsService.getById(id);
    if (userDetails.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      // Allow ADMIN to access any user's details
      throw new ForbiddenException(
        'User details do not belong to the current user, and you are not authorized.',
      );
    }
    return userDetails;
  }

  @Patch(':id')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Update user details by ID for the current user' })
  @ApiParam({ name: 'id', description: 'ID of the user details to update' })
  @ApiBody({ type: UpdateUserDetailsRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User details successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User details not found.' })
  async updateUserDetails(
    @Param('id') id: string,
    @Body() updateUserDetailsRequest: UpdateUserDetailsRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    const userId = currentUser.id;
    this.logger.debug(
      `Updating user details with ID: ${id} for user ID: ${userId} by user: ${currentUser.id}`,
    );
    // Additional check to ensure the user details belong to the specified userId
    const userDetails = await this.userDetailsService.getById(id);
    if (userDetails.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      // Allow ADMIN to update any user's details
      throw new ForbiddenException(
        'User details do not belong to the current user, and you are not authorized.',
      );
    }
    return this.userDetailsService.update(id, updateUserDetailsRequest);
  }

  @Patch(':id/set-default')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Set a specific user detail as default for the current user',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user details to set as default',
  })
  @ApiResponse({
    status: 200,
    description: 'User details successfully set as default.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User details not found.' })
  async setDefaultUserDetails(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const userId = currentUser.id;
    this.logger.debug(
      `Setting user details with ID: ${id} as default for user ID: ${userId} by user: ${currentUser.id}`,
    );
    // Additional check to ensure the user details belong to the specified userId
    const userDetails = await this.userDetailsService.getById(id);
    if (userDetails.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      // Allow ADMIN to set default for any user
      throw new ForbiddenException(
        'User details do not belong to the current user, and you are not authorized.',
      );
    }
    return this.userDetailsService.setDefault(id, userId);
  }

  @Delete(':id')
  @UseGuards(UserEmailJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Delete user details by ID for the current user' })
  @ApiParam({ name: 'id', description: 'ID of the user details to delete' })
  @ApiResponse({
    status: 200,
    description: 'User details successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User details not found.' })
  @HttpCode(200)
  async deleteUserDetails(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const userId = currentUser.id;
    this.logger.debug(
      `Deleting user details with ID: ${id} for user ID: ${userId} by user: ${currentUser.id}`,
    );
    // Additional check to ensure the user details belong to the specified userId
    const userDetails = await this.userDetailsService.getById(id);
    if (userDetails.userId !== userId && currentUser.role !== UserRole.ADMIN) {
      // Allow ADMIN to delete any user's details
      throw new ForbiddenException(
        'User details do not belong to the current user, and you are not authorized.',
      );
    }
    return this.userDetailsService.delete(id);
  }
}
