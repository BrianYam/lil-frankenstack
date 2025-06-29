import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDetailsRequestDto {
  @ApiProperty({ description: 'First name of the user' })
  @IsString({ message: 'firstName must be a string' })
  @IsNotEmpty({ message: 'firstName is missing' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is missing' })
  lastName: string;

  @ApiProperty({ description: 'Address line 1 of the user' })
  @IsString({ message: 'addressLine1 must be a string' })
  @IsNotEmpty({ message: 'addressLine1 is missing' })
  addressLine1: string;

  @ApiProperty({
    description: 'Address line 2 of the user (optional)',
    required: false,
  })
  @IsString({ message: 'addressLine2 must be a string' })
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City of the user' })
  @IsString({ message: 'city must be a string' })
  @IsNotEmpty({ message: 'city is missing' })
  city: string;

  @ApiProperty({ description: 'State/Province of the user' })
  @IsString({ message: 'state must be a string' })
  @IsNotEmpty({ message: 'state is missing' })
  state: string;

  @ApiProperty({ description: 'Postal code of the user' })
  @IsString({ message: 'postalCode must be a string' })
  @IsNotEmpty({ message: 'postalCode is missing' })
  postalCode: string;

  @ApiProperty({ description: 'Country of the user' })
  @IsString({ message: 'country must be a string' })
  @IsNotEmpty({ message: 'country is missing' })
  country: string;

  @ApiProperty({ description: 'Mobile number of the user' })
  @IsMobilePhone(undefined, undefined, {
    message: 'mobileNumber must be a valid mobile phone number',
  })
  @IsNotEmpty({ message: 'mobileNumber is missing' })
  mobileNumber: string;

  @ApiProperty({
    description: 'Indicates if this is the default user detail',
    default: false,
  })
  @IsBoolean({ message: 'isDefault must be a boolean' })
  @IsOptional()
  isDefault?: boolean = false;
}
