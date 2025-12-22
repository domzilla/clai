/**
 * @file wizard.ts
 * @module src/ui/wizard
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview First-run setup wizard for API key and model configuration.
 */

import { select, password, number } from '@inquirer/prompts';

import { ConfigManager } from '../config/manager.js';
import { colors } from './colors.js';
import type { Provider } from '../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../config/schema.js';
import { PROVIDER_MODELS, DEFAULT_MODELS, PROVIDER_API_KEY_URLS } from '../config/defaults.js';

/**
 * Prompts user to select a provider from available options.
 * @param options - Configuration options.
 * @param options.exclude - Providers to exclude from the list.
 * @param options.includeOnly - Only show these providers.
 * @param options.message - Custom message for the prompt.
 * @returns Selected provider, or null if cancelled.
 */
export async function selectProvider(options?: {
    exclude?: Provider[];
    includeOnly?: Provider[];
    message?: string;
}): Promise<Provider | null> {
    const exclude = options?.exclude || [];
    const includeOnly = options?.includeOnly;
    const message = options?.message || 'Select a provider:';

    let availableProviders = PROVIDERS.filter((p) => !exclude.includes(p));
    if (includeOnly) {
        availableProviders = availableProviders.filter((p) => includeOnly.includes(p));
    }

    if (availableProviders.length === 0) {
        return null;
    }

    try {
        const provider = await select<Provider | 'cancel'>({
            message,
            choices: [
                ...availableProviders.map((p) => ({
                    name: PROVIDER_DISPLAY_NAMES[p],
                    value: p as Provider | 'cancel',
                })),
                { name: colors.hint('Cancel'), value: 'cancel' as const },
            ],
        });

        return provider === 'cancel' ? null : provider;
    } catch {
        return null;
    }
}

/**
 * Prompts user to enter an API key.
 * @param provider - The provider to enter the key for.
 * @returns The API key, or null if cancelled.
 */
export async function enterApiKey(provider: Provider): Promise<string | null> {
    console.log(colors.hint(`\n  Get your API key at: ${PROVIDER_API_KEY_URLS[provider]}\n`));

    try {
        const apiKey = await password({
            message: `Enter your ${PROVIDER_DISPLAY_NAMES[provider]} API key:`,
            mask: '*',
            validate: (input) => {
                if (!input || input.length === 0) {
                    return 'API key is required';
                }
                return true;
            },
        });

        return apiKey;
    } catch {
        return null;
    }
}

/**
 * Prompts user to select a model from available options.
 * @param provider - The provider to show models for.
 * @param currentModel - Optional current model to mark as selected.
 * @returns Selected model string, or null if cancelled.
 */
export async function selectModel(
    provider: Provider,
    currentModel?: string,
): Promise<string | null> {
    const models = PROVIDER_MODELS[provider];
    const defaultModel = currentModel || DEFAULT_MODELS[provider];

    try {
        const model = await select<string>({
            message: 'Select your default model:',
            choices: models.map((m) => ({
                name: currentModel && m === currentModel ? `${m} (current)` : m,
                value: m,
            })),
            default: defaultModel,
        });

        return model;
    } catch {
        return null;
    }
}

/**
 * Interactive first-run setup wizard for configuring CLAI.
 * Guides users through provider selection, API key entry, and preferences.
 */
export class SetupWizard {
    private config: ConfigManager;

    /**
     * Creates a new SetupWizard instance.
     * @param config - ConfigManager instance to save configuration to.
     */
    constructor(config: ConfigManager) {
        this.config = config;
    }

    /**
     * Runs the interactive setup wizard.
     * Prompts for provider, API key, model, and command count preferences.
     * @returns True if setup completed, false if cancelled.
     */
    async run(): Promise<boolean> {
        console.log(colors.header('\n  Welcome to CLAI - AI-Powered Shell Command Generator\n'));
        console.log(colors.hint("  Let's set up your configuration."));
        console.log(colors.hint('  Press Ctrl+C to cancel.\n'));

        try {
            // Step 1: Select Provider
            const provider = await selectProvider({
                message: 'Select your preferred AI provider:',
            });

            if (!provider) {
                console.log(colors.hint('\n  Setup cancelled.\n'));
                return false;
            }

            // Step 2: Enter API Key
            const apiKey = await enterApiKey(provider);

            if (!apiKey) {
                console.log(colors.hint('\n  Setup cancelled.\n'));
                return false;
            }

            // Step 3: Select Default Model
            const model = await selectModel(provider);
            if (!model) {
                console.log(colors.hint('\n  Setup cancelled.\n'));
                return false;
            }

            // Step 4: Configure command count
            const commandCount = await number({
                message: 'How many command options should be generated? (1-10):',
                default: 3,
                min: 1,
                max: 10,
                validate: (input) => {
                    if (input === undefined || input < 1 || input > 10) {
                        return 'Please enter a number between 1 and 10';
                    }
                    return true;
                },
            });

            // Save configuration
            this.config.set('defaultProvider', provider);
            this.config.set('defaultModel', model);
            this.config.setApiKey(provider, apiKey);
            this.config.setPreference('commandCount', commandCount || 3);

            console.log(colors.success('\n  Configuration saved successfully!'));
            console.log(colors.hint(`  Config file: ${this.config.getConfigPath()}\n`));
            console.log(colors.value('  You can now use CLAI. Try:'));
            console.log(colors.command('    clai "list all files in current directory"\n'));
            console.log(colors.hint('  For shell integration (optional), run:'));
            console.log(colors.command('    clai init\n'));

            return true;
        } catch {
            console.log(colors.hint('\n  Setup cancelled.\n'));
            return false;
        }
    }
}
