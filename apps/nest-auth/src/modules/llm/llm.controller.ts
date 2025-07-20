import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatRequest } from './types/ai.types';
import { ChatService } from '@/modules/llm/services/chat.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: ChatService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequest) {
    return this.llmService.chat(chatRequest);
  }

  @Post('session')
  createSession() {
    const sessionId = this.llmService.createNewSession();
    return { sessionId };
  }

  @Get('conversation/:sessionId')
  getConversationHistory(@Param('sessionId') sessionId: string) {
    return this.llmService.getConversationHistory(sessionId);
  }
}
