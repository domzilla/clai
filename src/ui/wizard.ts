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
import chalk from 'chalk';
import { ConfigManager } from '../config/manager.js';
import type { Provider } from '../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../config/schema.js';
import { PROVIDER_MODELS, DEFAULT_MODELS, PROVIDER_API_KEY_URLS } from '../config/defaults.js';

export class SetupWizard {
    private config: ConfigManager;

    constructor(config: ConfigManager) {
        this.config = config;
    }

    async run(): Promise<void> {
        console.log(chalk.bold.cyan('\n  Welcome to CLAI - AI-Powered Shell Command Generator\n'));
        console.log(chalk.dim("  Let's set up your configuration.\n"));

        // Step 1: Select Provider
        const provider = await select<Provider>({
            message: 'Select your preferred AI provider:',
            choices: PROVIDERS.map((p) => ({
                name: PROVIDER_DISPLAY_NAMES[p],
                value: p,
            })),
        });

        // Step 2: Enter API Key
        console.log(chalk.dim(`\n  Get your API key at: ${PROVIDER_API_KEY_URLS[provider]}\n`));

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

        console.log(chalk.green('\n  Configuration saved successfully!'));
        console.log(chalk.dim(`  Config file: ${this.config.getConfigPath()}\n`));
        console.log(chalk.cyan('  You can now use CLAI. Try:'));
        console.log(chalk.white('    clai "list all files in current directory"\n'));
        console.log(chalk.dim('  For shell integration (optional), run:'));
        console.log(chalk.white('    clai init\n'));
    }
}
