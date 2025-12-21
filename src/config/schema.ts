/**
 * @file schema.ts
 * @module src/config/schema
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview TypeScript interfaces for configuration types.
 */

export type Provider = 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface ApiKeys {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    groq?: string;
}

export interface Preferences {
    commandCount: number;
    showExplanations: boolean;
}

export interface ClaiConfig {
    defaultProvider: Provider;
    defaultModel: string;
    apiKeys: ApiKeys;
    preferences: Preferences;
}

export const PROVIDERS: Provider[] = ['openai', 'anthropic', 'gemini', 'groq'];

export const PROVIDER_DISPLAY_NAMES: Record<Provider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    gemini: 'Google Gemini',
    groq: 'Groq',
};
