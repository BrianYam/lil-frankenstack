import { registerAs } from '@nestjs/config';
import { getEnvVar } from './utils/config.utils';

export default registerAs('ai', () => {
  return {
    openaiApiKey: getEnvVar('OPENAI_API_KEY', false, 'dummy-openai-key'),
    chatModel: getEnvVar('CHAT_MODEL', false, 'gpt-4o-mini'),
  };
});
