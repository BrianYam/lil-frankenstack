import { Injectable } from '@nestjs/common';
import { weatherTool } from '../tools/weather.tool';
import { AiService } from './ai.service';
import { MemoryService } from './memory.service';
import { ToolRunnerService } from './tool-runner.service';
import { ChatRequest, ChatResponse, ChatMessage, ChatRole } from '@/types';

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
      { role: ChatRole.USER, content: message },
    ]);

    // Run the agent loop
    while (true) {
      //TODO dont use infinite loop in production, handle exit conditions properly
      const history = this.memoryService.getMessages(sessionId);
      const response = await this.aiService.runLLM({
        messages: history,
        tools: [weatherTool], // Add weather tool
      });

      // Convert OpenAI response to our AIMessage format
      const aiMessage: ChatMessage = {
        role: ChatRole.ASSISTANT,
        content: response.content,
        tool_calls: response.tool_calls,
      };

      // Add AI response to conversation
      this.memoryService.addMessages(sessionId, [aiMessage]);

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

  getConversationHistory(sessionId: string): ChatResponse {
    const messages = this.memoryService.getMessages(sessionId);
    const lastMessage = messages[messages.length - 1];

    return {
      response: lastMessage?.content || '',
      sessionId,
      messages,
    };
  }

  createNewSession(): string {
    return this.memoryService.createSession();
  }

  getAllSessions(): string[] {
    const sessions = this.memoryService.getAllSessions();
    return sessions.map((session) => session.sessionId);
  }
}
