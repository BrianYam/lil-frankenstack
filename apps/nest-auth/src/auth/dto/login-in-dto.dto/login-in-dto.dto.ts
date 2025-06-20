import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
