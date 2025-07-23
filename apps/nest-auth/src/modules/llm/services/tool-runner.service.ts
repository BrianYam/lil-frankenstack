import { Injectable } from '@nestjs/common';
import { executeWeatherTool, weatherToolSchema } from '../tools/weather.tool';
import { TOOLS_CONFIG } from '@/modules/llm/tools/tools.config';
import { ToolCall } from '@/types';

@Injectable()
export class ToolRunnerService {
  async executeTool(toolCall: ToolCall): Promise<string> {
    const { name, arguments: argsString } = toolCall.function;

    try {
      const args = JSON.parse(argsString);

      switch (name) {
        case TOOLS_CONFIG.NAME.GET_WEATHER:
          const parsedArgs = weatherToolSchema.parse(args);
          return await executeWeatherTool(parsedArgs);

        default:
          return `Unknown tool: ${name}`;
      }
    } catch (error) {
      return `Error executing tool ${name}: ${error.message}`;
    }
  }
}
