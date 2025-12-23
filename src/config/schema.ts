/**
 * @file schema.ts
 * @module src/config/schema
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview TypeScript interfaces for configuration types.
 */

/** Supported AI provider identifiers. */
export type Provider = 'openai' | 'anthropic' | 'gemini' | 'xai';

/** API keys stored per provider. */
export interface ApiKeys {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    xai?: string;
}

/** Default models stored per provider. */
export interface ProviderModels {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    xai?: string;
}

/** User preferences for command generation. */
export interface Preferences {
    /** Number of command options to generate (1-10). */
    commandCount: number;
    /** Whether to show detailed explanations for commands. */
    showExplanations: boolean;
}

/** Complete CLAI configuration structure. */
export interface ClaiConfig {
    /** Default AI provider to use. */
    defaultProvider: Provider;
    /** API keys for each provider. */
    apiKeys: ApiKeys;
    /** Default models for each provider. */
    models: ProviderModels;
    /** User preferences. */
    preferences: Preferences;
}

/** List of all supported providers. */
export const PROVIDERS: Provider[] = ['openai', 'anthropic', 'gemini', 'xai'];

/** Human-readable display names for providers. */
export const PROVIDER_DISPLAY_NAMES: Record<Provider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    gemini: 'Google Gemini',
    xai: 'xAI (Grok)',
};

/** Risk level for generated commands. */
export type RiskLevel = 'low' | 'medium' | 'high';

/** List of valid risk levels. */
export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
