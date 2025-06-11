import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'testing@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Password123@',
  })
  @IsStrongPassword()
  password: string;
}
