import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { UserJwtAuthGuard } from '@/guards/user-jwt-auth.guard';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { User, CreateApiKeyDto } from '@/types';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeyController {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(ApiKeyController.name);
  }

  @Post()
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'The API key has been successfully created.',
  })
  @ApiBody({
    description: 'The API key creation data',
    // type: CreateApiKeyDto, //TODO make this a class, now it's an interface
    required: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @CurrentUser() user: User,
  ) {
    this.logger.debug(`Creating API key for user: ${user.id}`);
    return this.apiKeyService.createApiKey(user.id, createApiKeyDto);
  }

  @Get()
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, description: 'Return all API keys.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll() {
    return this.apiKeyService.getAllApiKeys();
  }

  @Get(':id')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an API key by ID' })
  @ApiResponse({ status: 200, description: 'Return the API key.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string) {
    return this.apiKeyService.getApiKeyById(id);
  }

  @Put(':id/regenerate')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate an API key' })
  @ApiResponse({
    status: 200,
    description: 'The API key has been regenerated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async regenerate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.apiKeyService.regenerateApiKey(id, user.id);
  }

  @Put(':id/deactivate')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an API key' })
  @ApiResponse({
    status: 200,
    description: 'The API key has been deactivated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.apiKeyService.deactivateApiKey(id, user.id);
  }

  @Delete(':id')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiResponse({ status: 200, description: 'The API key has been deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.apiKeyService.deleteApiKey(id, user.id);
  }
}
