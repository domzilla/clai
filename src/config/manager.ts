/**
 * @file manager.ts
 * @module src/config/manager
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Configuration persistence with read/write to ~/.clai/config.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';

import type { ClaiConfig, Provider, Preferences } from './schema.js';
import {
    DEFAULT_CONFIG,
    PROVIDER_ENV_VAR_NAMES,
    createDefaultConfig,
} from './defaults.js';

/**
 * Manages CLAI configuration persistence.
 * Reads and writes configuration to ~/.clai/config.
 */
export class ConfigManager {
    private configDir: string;
    private configPath: string;
    private config: ClaiConfig | null = null;

    /**
     * Creates a new ConfigManager instance.
     * @param configDir - Optional custom config directory path.
     */
    constructor(configDir?: string) {
        this.configDir = configDir || join(homedir(), '.clai');
        this.configPath = join(this.configDir, 'config');
    }

    /**
     * Checks if a configuration file exists.
     * @returns True if config file exists.
     */
    exists(): boolean {
        return existsSync(this.configPath);
    }

    /**
     * Checks if a valid provider is configured (default provider has an API key).
     * @returns True if config is ready to use.
     */
    isConfigured(): boolean {
        if (!this.exists()) {
            return false;
        }
        const config = this.load();
        const provider = config.defaultProvider;
        return provider !== undefined && this.hasApiKey(provider);
    }

    private ensureConfigDir(): void {
        if (!existsSync(this.configDir)) {
            mkdirSync(this.configDir, { recursive: true });
        }
    }

    private load(): ClaiConfig {
        if (this.config) {
            return this.config;
        }

        if (!this.exists()) {
            this.config = createDefaultConfig();
            return this.config;
        }

        try {
            const content = readFileSync(this.configPath, 'utf-8');
            const parsed = parseToml(content) as Partial<ClaiConfig>;

            // Merge with defaults to ensure all fields exist
            this.config = {
                defaultProvider: parsed.defaultProvider || DEFAULT_CONFIG.defaultProvider,
                defaultModel: parsed.defaultModel || DEFAULT_CONFIG.defaultModel,
                apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...parsed.apiKeys },
                preferences: { ...DEFAULT_CONFIG.preferences, ...parsed.preferences },
            };

            return this.config;
        } catch {
            this.config = createDefaultConfig();
            return this.config;
        }
    }

    private save(): void {
        this.ensureConfigDir();
        writeFileSync(
            this.configPath,
            stringifyToml(this.config as unknown as Record<string, unknown>),
            'utf-8',
        );
    }

    /**
     * Gets a configuration value by key.
     * @param key - The configuration key to retrieve.
     * @returns The configuration value.
     */
    get<K extends keyof ClaiConfig>(key: K): ClaiConfig[K] {
        return this.load()[key];
    }

    /**
     * Sets a configuration value.
     * @param key - The configuration key to set.
     * @param value - The value to set.
     */
    set<K extends keyof ClaiConfig>(key: K, value: ClaiConfig[K]): void {
        this.load();
        if (this.config) {
            this.config[key] = value;
            this.save();
        }
    }

    /**
     * Gets the complete configuration object.
     * @returns The full ClaiConfig object.
     */
    getAll(): ClaiConfig {
        return this.load();
    }

    /**
     * Resets configuration to default values.
     */
    reset(): void {
        this.config = createDefaultConfig();
        this.save();
    }

    /**
     * Sets an API key for a provider.
     * @param provider - The provider to set the key for.
     * @param key - The API key value.
     */
    setApiKey(provider: Provider, key: string): void {
        const config = this.load();
        if (!config.apiKeys) {
            config.apiKeys = {};
        }
        config.apiKeys[provider] = key;
        this.save();
    }

    /**
     * Removes an API key for a provider.
     * @param provider - The provider to remove the key for.
     */
    removeApiKey(provider: Provider): void {
        const config = this.load();
        if (config.apiKeys) {
            delete config.apiKeys[provider];
            this.save();
        }
    }

    /**
     * Gets an API key for a provider.
     * Environment variables take precedence over config file.
     * @param provider - The provider to get the key for.
     * @returns The API key or undefined if not set.
     */
    getApiKey(provider: Provider): string | undefined {
        // First check environment variables
        const envKey = process.env[PROVIDER_ENV_VAR_NAMES[provider]];
        if (envKey) {
            return envKey;
        }

        // Fall back to config file
        return this.load().apiKeys?.[provider];
    }

    /**
     * Checks if an API key is configured for a provider.
     * @param provider - The provider to check.
     * @returns True if an API key is available.
     */
    hasApiKey(provider: Provider): boolean {
        return !!this.getApiKey(provider);
    }

    /**
     * Sets a user preference value.
     * @param key - The preference key to set.
     * @param value - The preference value.
     */
    setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
        const config = this.load();
        if (!config.preferences) {
            config.preferences = { ...DEFAULT_CONFIG.preferences };
        }
        config.preferences[key] = value;
        this.save();
    }

    /**
     * Gets a user preference value.
     * @param key - The preference key to retrieve.
     * @returns The preference value.
     */
    getPreference<K extends keyof Preferences>(key: K): Preferences[K] {
        return this.load().preferences?.[key] ?? DEFAULT_CONFIG.preferences[key];
    }

    /**
     * Gets the full path to the config file.
     * @returns The config file path.
     */
    getConfigPath(): string {
        return this.configPath;
    }

    /**
     * Gets the config directory path.
     * @returns The config directory path.
     */
    getConfigDir(): string {
        return this.configDir;
    }
}

/** Singleton ConfigManager instance. */
export const configManager = new ConfigManager();
