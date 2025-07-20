import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIMessage } from '../types/ai.types';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async runLLM({
    messages,
    tools = [],
  }: {
    messages: AIMessage[];
    tools?: any[];
  }) {
    const systemPrompt = `You are a helpful AI assistant. Respond in a friendly and professional manner.`;

    // Convert our AIMessage format to OpenAI's expected format
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        { role: 'system', content: systemPrompt },
        ...messages.map(
          (msg): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
            if (msg.role === 'tool') {
              return {
                role: 'tool',
                content: msg.content || '',
                tool_call_id: msg.tool_call_id || '',
              };
            }
            if (msg.role === 'assistant' && msg.tool_calls) {
              return {
                role: 'assistant',
                content: msg.content,
                tool_calls: msg.tool_calls,
              };
            }
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content || '',
            };
          },
        ),
      ];

    const hasTools = tools.length > 0;

    const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: openAIMessages,
    };

    // Only add tool-related parameters if tools are provided
    if (hasTools) {
      requestOptions.tools = tools;
      requestOptions.tool_choice = 'auto';
      requestOptions.parallel_tool_calls = false;
    }

    const response = await this.openai.chat.completions.create(requestOptions);

    return response.choices[0].message;
  }
}
