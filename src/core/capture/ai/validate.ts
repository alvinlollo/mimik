import { logger } from '@/lib/logger';

export type KeyValidation = { valid: true } | { valid: false; reason: 'rejected' | 'network' };

const REQUEST_TIMEOUT_MS = 10_000;

const ENDPOINTS: Record<string, { url?: string; baseUrl?: boolean; headers: (key: string) => Record<string, string> }> =
  {
    openai: {
      url: 'https://api.openai.com/v1/models',
      headers: (key) => ({ Authorization: `Bearer ${key}` }),
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/models',
      headers: (key) => ({
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      }),
    },
    groq: {
      url: 'https://api.groq.com/openai/v1/models',
      headers: (key) => ({ Authorization: `Bearer ${key}` }),
    },
    openaiCompatible: {
      baseUrl: true,
      headers: (key) => ({ Authorization: `Bearer ${key}` }),
    },
  };

function endpointUrl(provider: string, baseUrl?: string): string | null {
  const endpoint = ENDPOINTS[provider];
  if (!endpoint) return null;
  if (endpoint.baseUrl) {
    const trimmed = baseUrl?.trim().replace(/\/+$/, '');
    return trimmed ? `${trimmed}/models` : null;
  }
  return endpoint.url ?? null;
}

export async function validateApiKey(provider: string, apiKey: string, baseUrl?: string): Promise<KeyValidation> {
  const url = endpointUrl(provider, baseUrl);
  if (!url) {
    logger.error('No API key validation endpoint for provider', provider);
    return { valid: false, reason: 'network' };
  }
  try {
    const res = await fetch(url, {
      headers: ENDPOINTS[provider].headers(apiKey),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403) return { valid: false, reason: 'rejected' };
    return { valid: false, reason: 'network' };
  } catch (err) {
    logger.error('API key validation request failed', err);
    return { valid: false, reason: 'network' };
  }
}
