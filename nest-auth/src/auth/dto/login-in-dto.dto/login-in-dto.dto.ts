import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginInDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'admin',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'admin',
  })
  @IsString()
  password: string;
}
