import { ApiProperty } from '@nestjs/swagger';
import { ChatRole } from '@/types';

export class AIMessageDto {
  @ApiProperty({
    description: 'The role of the message sender',
    enum: ChatRole,
    example: ChatRole.ASSISTANT,
  })
  role: ChatRole;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello! How can I help you today?',
    nullable: true,
  })
  content: string | null;

  @ApiProperty({
    description: 'Tool calls made by the assistant',
    required: false,
  })
  tool_calls?: any[];

  @ApiProperty({
    description: 'Tool call ID for tool responses',
    required: false,
  })
  tool_call_id?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'The response from the LLM',
    example: 'Hello! How can I help you today?',
  })
  response: string;

  @ApiProperty({
    description: 'The session ID for this conversation',
    example: 'abc123-def456-ghi789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'All messages in the conversation',
    type: [AIMessageDto],
  })
  messages: AIMessageDto[];
}

export class SessionResponseDto {
  @ApiProperty({
    description: 'The newly created session ID',
    example: 'abc123-def456-ghi789',
  })
  sessionId: string;
}
