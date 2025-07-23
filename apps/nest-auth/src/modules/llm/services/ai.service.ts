import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import OpenAI from 'openai';
import aiConfig from '@/configs/ai.config';
import { ChatRole, ChatMessage } from '@/types';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(
    @Inject(aiConfig.KEY)
    private readonly aiConfiguration: ConfigType<typeof aiConfig>,
  ) {
    this.openai = new OpenAI({
      apiKey: aiConfiguration.openaiApiKey,
    });
  }

  async runLLM({
    messages,
    tools = [],
  }: {
    messages: ChatMessage[];
    tools?: any[];
  }) {
    const systemPrompt = `You are a helpful AI assistant. Respond in a friendly and professional manner.`; //TODO move to config

    // Convert our AIMessage format to OpenAI's expected format
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        { role: ChatRole.SYSTEM, content: systemPrompt },
        ...messages.map(
          (msg): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
            if (msg.role === ChatRole.TOOL) {
              return {
                role: ChatRole.TOOL,
                content: msg.content || '',
                tool_call_id: msg.tool_call_id || '',
              };
            }
            if (msg.role === ChatRole.ASSISTANT && msg.tool_calls) {
              return {
                role: ChatRole.ASSISTANT,
                content: msg.content,
                tool_calls: msg.tool_calls,
              };
            }
            return {
              role: msg.role,
              content: msg.content || '',
            };
          },
        ),
      ];

    const hasTools = tools.length > 0;

    const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: this.aiConfiguration.chatModel,
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
