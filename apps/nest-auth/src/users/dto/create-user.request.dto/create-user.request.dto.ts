import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';
import { UserRole } from '@/types';

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

  @ApiProperty({
    description: 'The role of the user that determines access permissions',
    example: 'USER',
    enum: UserRole,
    enumName: 'UserRole',
    default: 'USER',
    required: false,
  })
  role?: UserRole;
}
