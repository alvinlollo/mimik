import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export function createModel(provider: string, model: string, apiKey: string, baseUrl?: string) {
  if (provider === 'anthropic') return createAnthropic({ apiKey })(model);
  if (provider === 'openaiCompatible') {
    const baseURL = baseUrl?.trim();
    return createOpenAI(baseURL ? { apiKey, baseURL } : { apiKey })(model);
  }
  if (provider === 'deepseek') return createOpenAI({ apiKey, baseURL: 'https://api.deepseek.com', name: 'deepseek' })(model);
  return createOpenAI({ apiKey })(model);
}
