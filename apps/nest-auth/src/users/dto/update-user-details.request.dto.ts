import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMobilePhone,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateUserDetailsRequestDto {
  @ApiProperty({
    description: 'The ID of the user this detail belongs to',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'First name of the user', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Last name of the user', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Address line 1 of the user', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({
    description: 'Address line 2 of the user (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City of the user', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State/Province of the user', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'Postal code of the user', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ description: 'Country of the user', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Mobile number of the user', required: false })
  @IsMobilePhone()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({
    description: 'Indicates if this is the default user detail',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
