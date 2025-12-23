/**
 * @file model-service.ts
 * @module src/services/model-service
 * @author Dominic Rodemer
 * @created 2025-12-23
 * @license MIT
 *
 * @fileoverview Model service that abstracts model fetching and validation.
 * Encapsulates config and provider access for UI screens.
 */

import type { Provider } from '../config/schema.js';
import { configManager } from '../config/manager.js';
import { getModels, validateModel } from '../providers/models.js';

/**
 * Fetches available models for a provider.
 * Uses provided API key or retrieves from config.
 *
 * @param provider - The AI provider.
 * @param apiKey - Optional API key (uses config if not provided).
 * @returns Array of available model names.
 */
export async function fetchModelsForProvider(
    provider: Provider,
    apiKey?: string,
): Promise<string[]> {
    const key = apiKey ?? configManager.getApiKey(provider);
    return getModels(provider, key);
}

/**
 * Validates a model exists for a provider.
 * Handles API key retrieval internally.
 *
 * @param provider - The AI provider.
 * @param model - The model ID to validate.
 * @returns true if valid, false if invalid, null if can't validate.
 */
export async function validateModelForProvider(
    provider: Provider,
    model: string,
): Promise<boolean | null> {
    const apiKey = configManager.getApiKey(provider);
    return validateModel(provider, model, apiKey);
}

/**
 * Fetches models for multiple providers in parallel.
 * Handles API key retrieval internally for each provider.
 *
 * @param providers - Array of providers to fetch models for.
 * @returns Record mapping provider to array of model names.
 */
export async function fetchModelsForProviders(
    providers: Provider[],
): Promise<Record<Provider, string[]>> {
    const result: Partial<Record<Provider, string[]>> = {};

    await Promise.all(
        providers.map(async (provider) => {
            result[provider] = await fetchModelsForProvider(provider);
        }),
    );

    return result as Record<Provider, string[]>;
}
