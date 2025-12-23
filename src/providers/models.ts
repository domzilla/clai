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
import { PROVIDER_ENV_VAR_NAMES, PROVIDER_MODELS } from '../config/defaults.js';

/** Cache for fetched models to avoid repeated API calls. */
const modelCache: Map<Provider, { models: string[]; timestamp: number }> = new Map();

/** Cache TTL in milliseconds (1 hour). */
const CACHE_TTL = 60 * 60 * 1000;

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

/** Default timeout for API requests in milliseconds. */
const API_TIMEOUT = 5000;

/** Maximum number of models to return. */
const MAX_MODELS = 15;

/**
 * Fetches from a provider API with appropriate authentication.
 * Handles Bearer token auth (OpenAI, xAI) and query param auth (Gemini).
 *
 * @param url - The API URL to fetch from.
 * @param apiKey - The API key for authentication.
 * @param useQueryParam - If true, append key as query param instead of header.
 * @returns The fetch Response or null if request fails.
 */
async function fetchFromProviderApi(
    url: string,
    apiKey: string,
    useQueryParam = false,
): Promise<Response | null> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        let fetchUrl = url;
        if (useQueryParam) {
            fetchUrl = `${url}?key=${apiKey}`;
        } else {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(fetchUrl, {
            headers,
            signal: AbortSignal.timeout(API_TIMEOUT),
        });

        return response.ok ? response : null;
    } catch {
        return null; // Network error, timeout, etc.
    }
}

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

    const useQueryParam = provider === 'gemini';
    const response = await fetchFromProviderApi(endpoint, apiKey, useQueryParam);
    if (!response) return null;

    if (provider === 'gemini') {
        const data = (await response.json()) as { models?: Array<{ name: string }> };
        return parseGeminiModels(data);
    } else {
        const data = (await response.json()) as { data?: Array<{ id: string }> };
        return parseOpenAIStyleModels(data, provider);
    }
}

/**
 * Checks if a model ID is a dated/versioned variant.
 * Examples: gpt-4-0613, gpt-5.2-2025-12-11, gemini-2.0-flash-001
 */
function isDatedVariant(id: string): boolean {
    // Match patterns like -0613, -1106, -0125, -2025-12-11, -001, -002
    return /(-\d{4,8}|-\d{4}-\d{2}-\d{2}|-0\d{2}$)/.test(id);
}

/** Keywords to exclude from model lists. */
const EXCLUDED_KEYWORDS = [
    'audio',
    'realtime',
    'embed',
    'preview',
    'research',
    'search',
    'chat-latest', // Aliases
    'image',
    'codex',
    'transcribe',
    'tts',
    'diarize',
    'instruct',
    'turbo', // Old models
    '3.5', // Old models
];

/**
 * Checks if a model should be excluded based on keywords.
 */
function shouldExcludeModel(id: string): boolean {
    const lower = id.toLowerCase();
    return EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Filters, sorts, and limits a list of model IDs.
 * Applies prefix matching, exclusion filters, and returns top models.
 *
 * @param models - Raw model IDs to filter.
 * @param prefixes - Prefixes that models must match.
 * @param extraExclusions - Additional exclusion patterns (e.g., 'aqa' for Gemini).
 * @returns Filtered, sorted, and limited array of model IDs.
 */
function filterAndSortModels(
    models: string[],
    prefixes: string[],
    extraExclusions: string[] = [],
): string[] {
    return models
        .filter((id) => prefixes.some((prefix) => id.startsWith(prefix)))
        .filter((id) => !shouldExcludeModel(id))
        .filter((id) => !isDatedVariant(id))
        .filter((id) => !extraExclusions.some((ex) => id.includes(ex)))
        .sort()
        .reverse()
        .slice(0, MAX_MODELS);
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

    const modelIds = data.data.map((m) => m.id);
    return filterAndSortModels(modelIds, TEXT_MODEL_PREFIXES[provider]);
}

/**
 * Parses Google Gemini models response.
 */
function parseGeminiModels(data: { models?: Array<{ name: string }> }): string[] {
    if (!data.models || !Array.isArray(data.models)) {
        return [];
    }

    const modelIds = data.models.map((m) => m.name.replace('models/', ''));
    return filterAndSortModels(modelIds, ['gemini-'], ['aqa']);
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
            modelCache.set(provider, { models: fetched, timestamp: Date.now() });
            return fetched;
        }
    }

    // Fall back to curated list
    return PROVIDER_MODELS[provider];
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

    return PROVIDER_MODELS[provider];
}

/**
 * Clears the model cache (useful for testing or forcing refresh).
 */
export function clearModelCache(): void {
    modelCache.clear();
}

/**
 * Validates if a model exists for a provider by checking against the API.
 * Returns true if the model is valid, false if invalid, or null if validation
 * is not possible (no API endpoint or no API key).
 *
 * @param provider - The AI provider.
 * @param modelId - The model ID to validate.
 * @param apiKey - Optional API key for validation.
 * @returns true if valid, false if invalid, null if cannot validate.
 */
export async function validateModel(
    provider: Provider,
    modelId: string,
    apiKey?: string,
): Promise<boolean | null> {
    const endpoint = MODEL_ENDPOINTS[provider];
    if (!endpoint) {
        return null; // Cannot validate - no API endpoint
    }

    const key = apiKey || process.env[PROVIDER_ENV_VAR_NAMES[provider]];
    if (!key) {
        return null; // Cannot validate - no API key
    }

    const useQueryParam = provider === 'gemini';
    const response = await fetchFromProviderApi(endpoint, key, useQueryParam);
    if (!response) return null;

    let allModels: string[] = [];

    if (provider === 'gemini') {
        const data = (await response.json()) as { models?: Array<{ name: string }> };
        allModels = (data.models || []).map((m) => m.name.replace('models/', ''));
    } else {
        const data = (await response.json()) as { data?: Array<{ id: string }> };
        allModels = (data.data || []).map((m) => m.id);
    }

    return allModels.includes(modelId);
}
