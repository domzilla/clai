/**
 * @file manager.test.ts
 * @module tests/unit/config/manager
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Unit tests for ConfigManager.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigManager } from '../../../src/config/manager.js';

describe('ConfigManager', () => {
    let tempDir: string;
    let configManager: ConfigManager;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'clai-test-'));
        configManager = new ConfigManager(tempDir);
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    describe('exists', () => {
        it('should return false when config does not exist', () => {
            expect(configManager.exists()).toBe(false);
        });

        it('should return true after setting a value', () => {
            configManager.set('defaultProvider', 'openai');
            expect(configManager.exists()).toBe(true);
        });
    });

    describe('get/set', () => {
        it('should retrieve a set value', () => {
            configManager.set('defaultModel', 'gpt-4o');
            expect(configManager.get('defaultModel')).toBe('gpt-4o');
        });

        it('should return default value when not set', () => {
            expect(configManager.get('defaultProvider')).toBe('openai');
        });
    });

    describe('setApiKey/getApiKey', () => {
        it('should store and retrieve API key for provider', () => {
            configManager.setApiKey('openai', 'sk-test-key');
            expect(configManager.getApiKey('openai')).toBe('sk-test-key');
        });

        it('should return undefined for unset provider', () => {
            expect(configManager.getApiKey('anthropic')).toBeUndefined();
        });

        it('should prefer environment variable over config', () => {
            const originalEnv = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'env-key';

            configManager.setApiKey('openai', 'config-key');
            expect(configManager.getApiKey('openai')).toBe('env-key');

            // Restore
            if (originalEnv !== undefined) {
                process.env.OPENAI_API_KEY = originalEnv;
            } else {
                delete process.env.OPENAI_API_KEY;
            }
        });
    });

    describe('hasApiKey', () => {
        it('should return true when API key is set', () => {
            configManager.setApiKey('openai', 'sk-test');
            expect(configManager.hasApiKey('openai')).toBe(true);
        });

        it('should return false when API key is not set', () => {
            expect(configManager.hasApiKey('groq')).toBe(false);
        });
    });

    describe('preferences', () => {
        it('should return default preference when not set', () => {
            // Create a fresh instance to ensure no pollution from other tests
            const freshManager = new ConfigManager(tempDir);
            expect(freshManager.getPreference('commandCount')).toBe(3);
            expect(freshManager.getPreference('showExplanations')).toBe(true);
        });

        it('should get and set preferences', () => {
            configManager.setPreference('commandCount', 5);
            expect(configManager.getPreference('commandCount')).toBe(5);
        });
    });

    describe('reset', () => {
        it('should reset configuration to defaults', () => {
            // Create a fresh instance for this test
            const resetManager = new ConfigManager(tempDir);

            resetManager.set('defaultProvider', 'anthropic');
            resetManager.set('defaultModel', 'claude-3-opus');
            resetManager.setPreference('commandCount', 10);

            resetManager.reset();

            expect(resetManager.get('defaultProvider')).toBe('openai');
            expect(resetManager.get('defaultModel')).toBe('gpt-4o-mini');
            expect(resetManager.getPreference('commandCount')).toBe(3);
        });
    });

    describe('getAll', () => {
        it('should return complete configuration', () => {
            configManager.set('defaultProvider', 'gemini');

            const all = configManager.getAll();

            expect(all.defaultProvider).toBe('gemini');
            expect(all).toHaveProperty('defaultModel');
            expect(all).toHaveProperty('apiKeys');
            expect(all).toHaveProperty('preferences');
        });
    });

    describe('getConfigPath/getConfigDir', () => {
        it('should return correct paths', () => {
            expect(configManager.getConfigDir()).toBe(tempDir);
            expect(configManager.getConfigPath()).toBe(join(tempDir, 'config.json'));
        });
    });

    describe('persistence', () => {
        it('should persist configuration across instances', () => {
            configManager.set('defaultModel', 'test-model');
            configManager.setApiKey('openai', 'test-key');

            // Create a new instance
            const newManager = new ConfigManager(tempDir);

            expect(newManager.get('defaultModel')).toBe('test-model');
            expect(newManager.getApiKey('openai')).toBe('test-key');
        });
    });
});
