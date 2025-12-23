/**
 * @file models.ts
 * @module src/providers/models
 * @author Dominic Rodemer
 * @created 2025-12-23
 * @license MIT
 *
 * @fileoverview Hybrid model fetcher with dynamic API fetching and static fallbacks.
 * Fetches available models from provider APIs when possible, falls back to curated defaults.
 */

import type { Provider } from '../config/schema.js';
import { PROVIDER_ENV_VAR_NAMES } from '../config/defaults.js';

/** Cache for fetched models to avoid repeated API calls. */
const modelCache: Map<Provider, { models: string[]; timestamp: number }> = new Map();

/** Cache TTL in milliseconds (1 hour). */
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Curated fallback models for each provider.
 * Updated December 2025. Use aliases without dates for stability.
 */
export const FALLBACK_MODELS: Record<Provider, string[]> = {
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

/** Default model for each provider (first in fallback list). */
export const DEFAULT_MODEL: Record<Provider, string> = {
    openai: 'gpt-4.1-mini',
    anthropic: 'claude-sonnet-4-5',
    gemini: 'gemini-2.5-flash',
    xai: 'grok-4',
};

/** Provider API endpoints for fetching models. */
const MODEL_ENDPOINTS: Partial<Record<Provider, string>> = {
    openai: 'https://api.openai.com/v1/models',
    xai: 'https://api.x.ai/v1/models',
    gemini: 'https://generativelanguage.googleapis.com/v1/models',
};

/** Model name prefixes to filter for text generation models. */
const TEXT_MODEL_PREFIXES: Record<Provider, string[]> = {
    openai: ['gpt-', 'o3', 'o4'],
    anthropic: ['claude-'],
    gemini: ['gemini-'],
    xai: ['grok-'],
};

/**
 * Fetches available models from a provider's API.
 * @param provider - The AI provider to fetch models from.
 * @param apiKey - The API key for authentication.
 * @returns Array of model names or null if fetch fails.
 */
async function fetchModelsFromApi(provider: Provider, apiKey: string): Promise<string[] | null> {
    const endpoint = MODEL_ENDPOINTS[provider];
    if (!endpoint) {
        return null; // Provider doesn't have a models API
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Set appropriate auth header based on provider
        if (provider === 'gemini') {
            // Gemini uses API key as query parameter
            const url = `${endpoint}?key=${apiKey}`;
            const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
            if (!response.ok) return null;
            const data = (await response.json()) as { models?: Array<{ name: string }> };
            return parseGeminiModels(data);
        } else {
            // OpenAI and xAI use Bearer token
            headers['Authorization'] = `Bearer ${apiKey}`;
            const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(5000) });
            if (!response.ok) return null;
            const data = (await response.json()) as { data?: Array<{ id: string }> };
            return parseOpenAIStyleModels(data, provider);
        }
    } catch {
        return null; // Network error, timeout, etc.
    }
}

/**
 * Parses OpenAI-style models response (also used by xAI).
 */
function parseOpenAIStyleModels(
    data: { data?: Array<{ id: string }> },
    provider: Provider,
): string[] {
    if (!data.data || !Array.isArray(data.data)) {
        return [];
    }

    const prefixes = TEXT_MODEL_PREFIXES[provider];
    return data.data
        .map((m) => m.id)
        .filter((id) => prefixes.some((prefix) => id.startsWith(prefix)))
        .filter((id) => !id.includes('audio') && !id.includes('realtime') && !id.includes('embed'))
        .sort()
        .reverse(); // Newest models typically sort last alphabetically, so reverse
}

/**
 * Parses Google Gemini models response.
 */
function parseGeminiModels(data: { models?: Array<{ name: string }> }): string[] {
    if (!data.models || !Array.isArray(data.models)) {
        return [];
    }

    return data.models
        .map((m) => m.name.replace('models/', ''))
        .filter((name) => name.startsWith('gemini-'))
        .filter(
            (name) =>
                !name.includes('embedding') &&
                !name.includes('aqa') &&
                !name.includes('text-to-speech') &&
                !name.includes('tts'),
        )
        .sort()
        .reverse();
}

/**
 * Gets available models for a provider using hybrid approach.
 * Tries to fetch from API first, falls back to curated list.
 * Results are cached for 1 hour.
 *
 * @param provider - The AI provider.
 * @param apiKey - Optional API key for fetching (uses env var if not provided).
 * @returns Array of available model names.
 */
export async function getModels(provider: Provider, apiKey?: string): Promise<string[]> {
    // Check cache first
    const cached = modelCache.get(provider);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.models;
    }

    // Resolve API key
    const key = apiKey || process.env[PROVIDER_ENV_VAR_NAMES[provider]];

    // Try to fetch from API if we have a key
    if (key) {
        const fetched = await fetchModelsFromApi(provider, key);
        if (fetched && fetched.length > 0) {
            // Merge with fallback to ensure curated models are available
            const merged = mergeModels(fetched, FALLBACK_MODELS[provider]);
            modelCache.set(provider, { models: merged, timestamp: Date.now() });
            return merged;
        }
    }

    // Fall back to curated list
    return FALLBACK_MODELS[provider];
}

/**
 * Merges fetched models with fallback list.
 * Prioritizes fetched models but ensures fallback models are included.
 */
function mergeModels(fetched: string[], fallback: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    // Add fetched models first (limited to avoid overwhelming the list)
    for (const model of fetched.slice(0, 15)) {
        if (!seen.has(model)) {
            seen.add(model);
            result.push(model);
        }
    }

    // Add fallback models that weren't in fetched list
    for (const model of fallback) {
        if (!seen.has(model)) {
            seen.add(model);
            result.push(model);
        }
    }

    return result;
}

/**
 * Gets models synchronously using only the fallback list.
 * Use when async fetching is not possible.
 *
 * @param provider - The AI provider.
 * @returns Array of fallback model names.
 */
export function getModelsSync(provider: Provider): string[] {
    // Check cache first
    const cached = modelCache.get(provider);
    if (cached) {
        return cached.models;
    }

    return FALLBACK_MODELS[provider];
}

/**
 * Clears the model cache (useful for testing or forcing refresh).
 */
export function clearModelCache(): void {
    modelCache.clear();
}
