import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CandidateStatus } from '../../../types/candidate.types';
import { CreateCandidateDto } from './create-candidate.dto';

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
  @ApiPropertyOptional({
    description: 'Status of the candidate in the hiring process',
    enum: CandidateStatus,
    example: CandidateStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;
}
