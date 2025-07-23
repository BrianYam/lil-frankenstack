import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ChatRequestDto, ChatResponseDto, SessionResponseDto } from './dto';
import { ChatService } from '@/modules/llm/services/chat.service';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'Send a chat request to the LLM' })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat response from the LLM',
    type: ChatResponseDto,
  })
  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.chat(chatRequest);
  }

  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'New session created successfully',
    type: SessionResponseDto,
  })
  @Post('session')
  createSession(): SessionResponseDto {
    const sessionId = this.chatService.createNewSession();
    return { sessionId };
  }

  @ApiOperation({ summary: 'Get conversation history for a session' })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'The session ID to retrieve conversation history for',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation history retrieved successfully',
    type: ChatResponseDto,
  })
  @Get('conversation/:sessionId')
  getConversationHistory(
    @Param('sessionId') sessionId: string,
  ): ChatResponseDto {
    const result = this.chatService.getConversationHistory(sessionId);
    return {
      response: result.response,
      sessionId: result.sessionId,
      messages: result.messages,
    };
  }

  @ApiOperation({ summary: 'Get all active chat sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all active chat sessions',
    type: [String],
  })
  @Get('sessions')
  getAllSessions(): string[] {
    return this.chatService.getAllSessions();
  }
}
