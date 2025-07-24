/**
 * Candidate controller
 * Handles HTTP requests for candidate operations
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateFiltersDto,
  PaginationDto,
  SearchCandidatesDto,
} from './dto';
import { CandidateSearchResult, CandidateStats } from '@/types';

@ApiTags('Candidates')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new candidate',
    description:
      'Creates a new candidate with vector embeddings for AI-powered matching',
  })
  @ApiResponse({
    status: 201,
    description: 'Candidate created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'hired', 'rejected', 'on_hold'],
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Candidate with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createCandidate(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidateService.createCandidate(createCandidateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all candidates',
    description: 'Retrieves candidates with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidates retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              currentTitle: { type: 'string' },
              currentCompany: { type: 'string' },
              status: { type: 'string' },
              experienceLevel: { type: 'string' },
              location: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            hasNext: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getAllCandidates(
    @Query() filters: CandidateFiltersDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.candidateService.getAllCandidates(filters, pagination);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get candidate statistics',
    description:
      'Retrieves statistics about candidates grouped by status and experience level',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: 'object',
  })
  async getCandidateStats(): Promise<CandidateStats> {
    return this.candidateService.getCandidateStats();
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search candidates using AI',
    description:
      'Search for candidates using vector similarity matching based on job description or skills',
  })
  @ApiBody({ type: SearchCandidatesDto })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          currentTitle: { type: 'string' },
          currentCompany: { type: 'string' },
          similarity: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
  })
  async searchCandidates(
    @Body() searchDto: SearchCandidatesDto,
  ): Promise<CandidateSearchResult[]> {
    return this.candidateService.searchSimilarCandidates(searchDto);
  }

  @Get('search/skills')
  @ApiOperation({
    summary: 'Search candidates by skills',
    description:
      'Search for candidates with specific skills using vector similarity',
  })
  @ApiQuery({
    name: 'skills',
    required: true,
    type: 'string',
    isArray: true,
    description: 'Array of skills to search for',
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @ApiQuery({
    name: 'minSimilarity',
    required: false,
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: 'Minimum similarity threshold',
    example: 0.6,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    minimum: 1,
    maximum: 50,
    description: 'Maximum number of results',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Candidates found successfully',
    type: [Object],
  })
  async searchCandidatesBySkills(
    @Query('skills') skills: string[],
    @Query('minSimilarity') minSimilarity: number = 0.6,
    @Query('limit') limit: number = 10,
  ): Promise<CandidateSearchResult[]> {
    return this.candidateService.searchCandidatesBySkills(
      Array.isArray(skills) ? skills : [skills],
      minSimilarity,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get candidate by ID',
    description: 'Retrieves a specific candidate by their UUID',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Candidate UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidate found successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        currentTitle: { type: 'string' },
        currentCompany: { type: 'string' },
        experienceLevel: { type: 'string' },
        yearsOfExperience: { type: 'number' },
        expectedSalary: { type: 'number' },
        location: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate not found',
  })
  async getCandidateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.candidateService.getCandidateById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update candidate',
    description:
      'Updates a candidate and regenerates embeddings if content changed',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Candidate UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidate updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists for another candidate',
  })
  async updateCandidate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidateService.updateCandidate(id, updateCandidateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete candidate',
    description: 'Soft deletes a candidate (marks as deleted but keeps data)',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Candidate UUID',
  })
  @ApiResponse({
    status: 204,
    description: 'Candidate deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate not found',
  })
  async deleteCandidate(@Param('id', ParseUUIDPipe) id: string) {
    await this.candidateService.deleteCandidate(id);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk import candidates',
    description: 'Import multiple candidates at once (useful for CSV imports)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        candidates: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateCandidateDto' },
        },
      },
      required: ['candidates'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk import completed',
    schema: {
      type: 'object',
      properties: {
        successful: {
          type: 'array',
          items: { type: 'object' },
          description: 'Successfully imported candidates',
        },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              data: { type: 'object' },
              error: { type: 'string' },
            },
          },
          description: 'Failed imports with error messages',
        },
      },
    },
  })
  async bulkImportCandidates(
    @Body() body: { candidates: CreateCandidateDto[] },
  ) {
    return this.candidateService.bulkImportCandidates(body.candidates);
  }
}
