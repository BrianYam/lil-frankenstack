import { z } from 'zod';

export const weatherToolSchema = z.object({
  location: z.string().describe('The location to get weather for'),
});

export const weatherTool = {
  type: 'function' as const,
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a specific location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description:
            'The location to get weather for (e.g., "New York", "London")',
        },
      },
      required: ['location'],
    },
  },
};

export async function executeWeatherTool(
  args: z.infer<typeof weatherToolSchema>,
): Promise<string> {
  // For now, always return 36 degrees Celsius
  const { location } = args;
  return `The current weather in ${location} is 36°C (97°F) with clear skies.`;
}
