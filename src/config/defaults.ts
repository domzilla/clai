import type { ClaiConfig, Provider } from './schema.js';

export const DEFAULT_CONFIG: ClaiConfig = {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  apiKeys: {},
  preferences: {
    commandCount: 3,
    showExplanations: true
  }
};

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229'
  ],
  gemini: [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ]
};

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile'
};

export const PROVIDER_API_KEY_URLS: Record<Provider, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys'
};
