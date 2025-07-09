import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class TelegramMessageDto {
  @ApiProperty({
    description: 'The chat ID to send the message to',
    example: '-1001234567890',
    required: true,
  })
  @IsNotEmpty()
  chatId: string | number;

  @ApiProperty({
    description: 'The message content to send',
    example: 'Hello from the API!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class TelegramBroadcastDto {
  @ApiProperty({
    description: 'Array of chat IDs to broadcast the message to',
    example: ['-1001234567890', '-1009876543210'],
    isArray: true,
    required: true,
  })
  @IsArray()
  @IsNotEmpty()
  chatIds: (string | number)[];

  @ApiProperty({
    description: 'The message content to broadcast',
    example: 'This is a broadcast message',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
