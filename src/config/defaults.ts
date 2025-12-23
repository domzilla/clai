/**
 * @file defaults.ts
 * @module src/config/defaults
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Default configuration values and available models per provider.
 */

import type { ClaiConfig, Provider } from './schema.js';

/** Default configuration values for new installations. */
export const DEFAULT_CONFIG: ClaiConfig = {
    defaultProvider: 'openai',
    apiKeys: {},
    models: {},
    preferences: {
        commandCount: 3,
        showExplanations: true,
    },
};

/**
 * Curated fallback models for each provider.
 * These are used when dynamic fetching fails or is unavailable.
 * Updated December 2025. Use aliases without dates for stability.
 */
export const PROVIDER_MODELS: Record<Provider, string[]> = {
    openai: [
        'gpt-5.2',
        'gpt-5.1',
        'gpt-4.1',
        'gpt-4.1-mini',
        'gpt-4.1-nano',
        'o4-mini',
        'o3',
    ],
    anthropic: [
        'claude-opus-4-5',
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-opus-4-1',
        'claude-sonnet-4',
    ],
    gemini: [
        'gemini-3-flash-preview',
        'gemini-3-pro-preview',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
    ],
    xai: [
        'grok-4-1-fast-reasoning',
        'grok-4-1-fast-non-reasoning',
        'grok-4',
        'grok-4-fast-reasoning',
        'grok-3',
    ],
};

/** Default model for each provider. */
export const DEFAULT_MODELS: Record<Provider, string> = {
    openai: 'gpt-4.1-mini',
    anthropic: 'claude-sonnet-4-5',
    gemini: 'gemini-2.5-flash',
    xai: 'grok-4',
};

/** URLs where users can obtain API keys for each provider. */
export const PROVIDER_API_KEY_URLS: Record<Provider, string> = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    gemini: 'https://aistudio.google.com/app/apikey',
    xai: 'https://console.x.ai',
};

/** Environment variable names for each provider's API key. */
export const PROVIDER_ENV_VAR_NAMES: Record<Provider, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GOOGLE_API_KEY',
    xai: 'XAI_API_KEY',
};

/**
 * Creates a deep copy of the default configuration.
 * @returns A new ClaiConfig object with default values.
 */
export function createDefaultConfig(): ClaiConfig {
    return {
        defaultProvider: DEFAULT_CONFIG.defaultProvider,
        apiKeys: { ...DEFAULT_CONFIG.apiKeys },
        models: { ...DEFAULT_CONFIG.models },
        preferences: { ...DEFAULT_CONFIG.preferences },
    };
}
