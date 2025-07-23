import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'The message content to send to the LLM',
    example: 'Hello, how can you help me today?',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Optional session ID to continue an existing conversation',
    example: 'abc123-def456-ghi789',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
