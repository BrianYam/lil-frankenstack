import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { ChatService } from './services/chat.service';
import { MemoryService } from './services/memory.service';
import { ToolRunnerService } from './services/tool-runner.service';
import { LlmController } from '@/modules/llm/llm.controller';

@Module({
  controllers: [LlmController],
  providers: [AiService, ChatService, MemoryService, ToolRunnerService],
  exports: [ChatService],
})
export class LlmModule {}
