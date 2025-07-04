import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token sent to user email',
    example: '6a1b836ffcf1b5d8d7e0e397d8f7b3c95e1f3d2a1c0b9a8f7e6d5c4b3a2f1e0d',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
