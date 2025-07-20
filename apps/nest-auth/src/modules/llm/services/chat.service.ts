import { Injectable } from '@nestjs/common';
import { weatherTool } from '../tools/weather.tool';
import { ChatRequest, ChatResponse, AIMessage } from '../types/ai.types';
import { AiService } from './ai.service';
import { MemoryService } from './memory.service';
import { ToolRunnerService } from './tool-runner.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly aiService: AiService,
    private readonly memoryService: MemoryService,
    private readonly toolRunnerService: ToolRunnerService,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId: providedSessionId } = request;

    // Create or use existing session
    const sessionId = providedSessionId || this.memoryService.createSession();

    // Add user message to conversation
    this.memoryService.addMessages(sessionId, [
      { role: 'user', content: message },
    ]);

    // Run the agent loop
    while (true) {
      const history = this.memoryService.getMessages(sessionId);
      const response = await this.aiService.runLLM({
        messages: history,
        tools: [weatherTool], // Add weather tool
      });

      // Add AI response to conversation
      this.memoryService.addMessages(sessionId, [response]);

      // If response has content, return it
      if (response.content) {
        return {
          response: response.content,
          sessionId,
          messages: this.memoryService.getMessages(sessionId),
        };
      }

      // If response has tool calls, execute them
      if (response.tool_calls) {
        for (const toolCall of response.tool_calls) {
          const toolResponse =
            await this.toolRunnerService.executeTool(toolCall);
          this.memoryService.saveToolResponse(
            sessionId,
            toolCall.id,
            toolResponse,
          );
        }
      }
    }
  }

  getConversationHistory(sessionId: string): AIMessage[] {
    return this.memoryService.getMessages(sessionId);
  }

  createNewSession(): string {
    return this.memoryService.createSession();
  }
}
