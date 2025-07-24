import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ExperienceLevel } from '../../../types/candidate.types';

export class CreateCandidateDto {
  @ApiProperty({
    description: 'First name of the candidate',
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the candidate',
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the candidate',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the candidate',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Current job title',
    example: 'Senior Software Engineer',
  })
  @IsOptional()
  @IsString()
  currentTitle?: string;

  @ApiPropertyOptional({
    description: 'Current company',
    example: 'Tech Corp Inc.',
  })
  @IsOptional()
  @IsString()
  currentCompany?: string;

  @ApiPropertyOptional({
    description: 'Experience level of the candidate',
    enum: ExperienceLevel,
    example: ExperienceLevel.SENIOR,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Years of professional experience',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Expected salary in the specified currency',
    example: 120000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedSalary?: number;

  @ApiPropertyOptional({
    description: 'Currency code for expected salary',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Current location of the candidate',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Whether the candidate is open to remote work',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isRemoteOk?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the candidate is willing to relocate',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isWillingToRelocate?: boolean;

  @ApiPropertyOptional({
    description: 'URL to candidate resume/CV',
    example: 'https://example.com/resume.pdf',
  })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to candidate portfolio',
    example: 'https://johndoe.dev',
  })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
  })
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of skills and technologies',
    example: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Professional summary or bio',
    example:
      'Experienced full-stack developer with expertise in modern web technologies...',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Internal notes about the candidate',
    example: 'Great cultural fit, strong technical skills',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'How the candidate was sourced',
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Date when candidate will be available to start',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  availableFrom?: Date;

  @ApiPropertyOptional({
    description: 'Notice period required at current job',
    example: '2 weeks',
  })
  @IsOptional()
  @IsString()
  noticePeriod?: string;
}
