import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { CandidateStatus, ExperienceLevel } from '@/types';

export class CandidateFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by candidate status',
    enum: CandidateStatus,
    isArray: true,
    example: [CandidateStatus.ACTIVE, CandidateStatus.ON_HOLD],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CandidateStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: CandidateStatus[];

  @ApiPropertyOptional({
    description: 'Filter by experience level',
    enum: ExperienceLevel,
    isArray: true,
    example: [ExperienceLevel.SENIOR, ExperienceLevel.LEAD],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ExperienceLevel, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  experienceLevel?: ExperienceLevel[];

  @ApiPropertyOptional({
    description: 'Filter by location (partial match)',
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filter by remote work preference',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isRemoteOk?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum expected salary',
    example: 80000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSalary?: number;

  @ApiPropertyOptional({
    description: 'Maximum expected salary',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxSalary?: number;

  @ApiPropertyOptional({
    description: 'Filter by skills (candidates must have at least one)',
    example: ['JavaScript', 'React'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Minimum years of experience',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  minYearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Maximum years of experience',
    example: 10,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  maxYearsOfExperience?: number;
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class SearchCandidatesDto {
  @ApiPropertyOptional({
    description: 'Job description or requirements to match against',
    example: 'Looking for a senior React developer with 5+ years experience',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Skills to search for using vector similarity',
    example: ['React', 'TypeScript', 'Node.js'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Minimum similarity threshold (0-1)',
    example: 0.7,
    minimum: 0,
    maximum: 1,
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minSimilarity?: number = 0.5;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}
