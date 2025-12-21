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
            const providerChoice = await select<Provider | 'cancel'>({
                message: 'Select your preferred AI provider:',
                choices: [
                    ...PROVIDERS.map((p) => ({
                        name: PROVIDER_DISPLAY_NAMES[p],
                        value: p as Provider | 'cancel',
                    })),
                    { name: colors.hint('Cancel'), value: 'cancel' as const },
                ],
            });

            if (providerChoice === 'cancel') {
                console.log(colors.hint('\n  Setup cancelled.\n'));
                return false;
            }

            const provider = providerChoice;

            // Step 2: Enter API Key
            console.log(colors.hint(`\n  Get your API key at: ${PROVIDER_API_KEY_URLS[provider]}\n`));

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

            // Step 3: Select Default Model
            const models = PROVIDER_MODELS[provider];
            const model = await select<string>({
                message: 'Select your default model:',
                choices: models.map((m) => ({
                    name: m,
                    value: m,
                })),
                default: DEFAULT_MODELS[provider],
            });

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
