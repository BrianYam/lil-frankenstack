import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserDetailsRequestDto {
  @ApiProperty({
    description: 'The ID of the user this detail belongs to',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'First name of the user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Address line 1 of the user' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({
    description: 'Address line 2 of the user (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City of the user' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province of the user' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal code of the user' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country of the user' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Mobile number of the user' })
  @IsMobilePhone()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({
    description: 'Indicates if this is the default user detail',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
