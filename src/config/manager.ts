/**
 * @file manager.ts
 * @module src/config/manager
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Configuration persistence with read/write to ~/.clai/config.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { ClaiConfig, Provider, Preferences } from './schema.js';
import { DEFAULT_CONFIG } from './defaults.js';

export class ConfigManager {
    private configDir: string;
    private configPath: string;
    private config: ClaiConfig | null = null;

    constructor(configDir?: string) {
        this.configDir = configDir || join(homedir(), '.clai');
        this.configPath = join(this.configDir, 'config.json');
    }

    exists(): boolean {
        return existsSync(this.configPath);
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
            this.config = {
                defaultProvider: DEFAULT_CONFIG.defaultProvider,
                defaultModel: DEFAULT_CONFIG.defaultModel,
                apiKeys: { ...DEFAULT_CONFIG.apiKeys },
                preferences: { ...DEFAULT_CONFIG.preferences },
            };
            return this.config;
        }

        try {
            const content = readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(content) as Partial<ClaiConfig>;

            // Merge with defaults to ensure all fields exist
            this.config = {
                defaultProvider: parsed.defaultProvider || DEFAULT_CONFIG.defaultProvider,
                defaultModel: parsed.defaultModel || DEFAULT_CONFIG.defaultModel,
                apiKeys: { ...DEFAULT_CONFIG.apiKeys, ...parsed.apiKeys },
                preferences: { ...DEFAULT_CONFIG.preferences, ...parsed.preferences },
            };

            return this.config;
        } catch {
            this.config = {
                defaultProvider: DEFAULT_CONFIG.defaultProvider,
                defaultModel: DEFAULT_CONFIG.defaultModel,
                apiKeys: { ...DEFAULT_CONFIG.apiKeys },
                preferences: { ...DEFAULT_CONFIG.preferences },
            };
            return this.config;
        }
    }

    private save(): void {
        this.ensureConfigDir();
        writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    }

    get<K extends keyof ClaiConfig>(key: K): ClaiConfig[K] {
        return this.load()[key];
    }

    set<K extends keyof ClaiConfig>(key: K, value: ClaiConfig[K]): void {
        this.load();
        if (this.config) {
            this.config[key] = value;
            this.save();
        }
    }

    getAll(): ClaiConfig {
        return this.load();
    }

    reset(): void {
        // Deep copy to avoid mutating DEFAULT_CONFIG
        this.config = {
            defaultProvider: DEFAULT_CONFIG.defaultProvider,
            defaultModel: DEFAULT_CONFIG.defaultModel,
            apiKeys: { ...DEFAULT_CONFIG.apiKeys },
            preferences: { ...DEFAULT_CONFIG.preferences },
        };
        this.save();
    }

    setApiKey(provider: Provider, key: string): void {
        const config = this.load();
        if (!config.apiKeys) {
            config.apiKeys = {};
        }
        config.apiKeys[provider] = key;
        this.save();
    }

    getApiKey(provider: Provider): string | undefined {
        // First check environment variables
        const envVarNames: Record<Provider, string> = {
            openai: 'OPENAI_API_KEY',
            anthropic: 'ANTHROPIC_API_KEY',
            gemini: 'GOOGLE_API_KEY',
            groq: 'GROQ_API_KEY',
        };

        const envKey = process.env[envVarNames[provider]];
        if (envKey) {
            return envKey;
        }

        // Fall back to config file
        return this.load().apiKeys?.[provider];
    }

    hasApiKey(provider: Provider): boolean {
        return !!this.getApiKey(provider);
    }

    setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
        const config = this.load();
        if (!config.preferences) {
            config.preferences = { ...DEFAULT_CONFIG.preferences };
        }
        config.preferences[key] = value;
        this.save();
    }

    getPreference<K extends keyof Preferences>(key: K): Preferences[K] {
        return this.load().preferences?.[key] ?? DEFAULT_CONFIG.preferences[key];
    }

    getConfigPath(): string {
        return this.configPath;
    }

    getConfigDir(): string {
        return this.configDir;
    }
}

export const configManager = new ConfigManager();
