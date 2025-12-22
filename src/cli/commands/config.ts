/**
 * @file config.ts
 * @module src/cli/commands/config
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Configuration management commands (show, set, reset, wizard).
 */

import { configManager } from '../../config/manager.js';
import {
    SetupWizard,
    runProviderManager,
    runModelManager,
} from '../../ui/wizard.js';
import { colors } from '../../ui/colors.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import { PROVIDER_MODELS } from '../../config/defaults.js';

/**
 * Displays the current configuration.
 * Shows provider, model, preferences, and API key status.
 */
export async function configShowCommand(): Promise<void> {
    if (!configManager.exists()) {
        console.log(colors.warning('No configuration found.'));
        console.log(colors.hint('Run: clai config wizard'));
        return;
    }

    const config = configManager.getAll();

    console.log(colors.header('\n  CLAI Configuration\n'));
    console.log(colors.hint(`  Config file: ${configManager.getConfigPath()}\n`));

    console.log(
        colors.label('  Provider:      ') +
            colors.value(PROVIDER_DISPLAY_NAMES[config.defaultProvider]),
    );
    console.log(colors.label('  Model:         ') + colors.value(config.defaultModel));
    console.log(
        colors.label('  Command count: ') + colors.value(String(config.preferences.commandCount)),
    );
    console.log(
        colors.label('  Explanations:  ') +
            colors.value(config.preferences.showExplanations ? 'Yes' : 'No'),
    );

    console.log(colors.label('\n  API Keys:'));
    for (const provider of PROVIDERS) {
        const hasKey = configManager.hasApiKey(provider);
        const status = hasKey ? colors.success('configured') : colors.hint('not set');
        console.log(`    ${PROVIDER_DISPLAY_NAMES[provider]}: ${status}`);
    }

    console.log('');
}

/**
 * Sets a configuration value.
 * @param key - Configuration key (provider, model, commandCount, showExplanations).
 * @param value - Value to set.
 */
export async function configSetCommand(key: string, value: string): Promise<void> {
    const validKeys = ['provider', 'model', 'commandCount', 'showExplanations'];

    if (!validKeys.includes(key)) {
        console.error(colors.error(`Invalid key: ${key}`));
        console.log(colors.hint(`Valid keys: ${validKeys.join(', ')}`));
        process.exit(1);
    }

    switch (key) {
        case 'provider':
            if (!PROVIDERS.includes(value as Provider)) {
                console.error(colors.error(`Invalid provider: ${value}`));
                console.log(colors.hint(`Valid providers: ${PROVIDERS.join(', ')}`));
                process.exit(1);
            }
            configManager.set('defaultProvider', value as Provider);
            break;

        case 'model': {
            // Validate model exists for some provider
            const currentProvider = configManager.get('defaultProvider');
            const currentProviderModels = PROVIDER_MODELS[currentProvider];

            if (currentProviderModels.includes(value)) {
                // Model is valid for current provider
                configManager.set('defaultModel', value);
            } else {
                // Check if model is valid for any other provider
                const matchingProvider = PROVIDERS.find((p) =>
                    PROVIDER_MODELS[p].includes(value),
                );

                if (matchingProvider) {
                    console.log(
                        colors.warning(
                            `Model '${value}' is for ${PROVIDER_DISPLAY_NAMES[matchingProvider]}, not ${PROVIDER_DISPLAY_NAMES[currentProvider]}.`,
                        ),
                    );
                    console.log(
                        colors.hint(
                            `Switching default provider to ${PROVIDER_DISPLAY_NAMES[matchingProvider]}.`,
                        ),
                    );
                    configManager.set('defaultProvider', matchingProvider);
                    configManager.set('defaultModel', value);
                } else {
                    console.error(colors.error(`Unknown model: ${value}`));
                    console.log(
                        colors.hint(`Models for ${currentProvider}: ${currentProviderModels.join(', ')}`),
                    );
                    process.exit(1);
                }
            }
            break;
        }

        case 'commandCount': {
            const count = parseInt(value, 10);
            if (isNaN(count) || count < 1 || count > 10) {
                console.error(colors.error('Command count must be between 1 and 10'));
                process.exit(1);
            }
            configManager.setPreference('commandCount', count);
            break;
        }

        case 'showExplanations': {
            const boolValue = value.toLowerCase() === 'true' || value === '1';
            configManager.setPreference('showExplanations', boolValue);
            break;
        }
    }

    console.log(colors.success(`Set ${key} = ${value}`));
}

/**
 * Resets configuration to default values.
 */
export async function configResetCommand(): Promise<void> {
    configManager.reset();
    console.log(colors.success('Configuration reset to defaults.'));
}

/**
 * Runs the interactive setup wizard.
 */
export async function configWizardCommand(): Promise<void> {
    const wizard = new SetupWizard(configManager);
    await wizard.run();
}

/**
 * Runs an interactive model selection wizard.
 * Shows available models for the selected provider.
 * If multiple providers are configured, allows provider selection first.
 */
export async function configModelCommand(): Promise<void> {
    if (!configManager.exists()) {
        console.log(colors.warning('No configuration found.'));
        console.log(colors.hint('Run: clai config wizard'));
        return;
    }

    const configuredProviders = PROVIDERS.filter((p) => configManager.hasApiKey(p));
    const currentProvider = configManager.get('defaultProvider');
    const currentModel = configManager.get('defaultModel');

    const result = await runModelManager(configuredProviders, currentProvider, currentModel);

    if (!result) {
        console.log(colors.hint('\n  Cancelled.\n'));
        return;
    }

    // Update provider if changed
    if (result.provider !== currentProvider) {
        configManager.set('defaultProvider', result.provider);
        console.log(colors.success(`\n  Default provider changed to: ${PROVIDER_DISPLAY_NAMES[result.provider]}`));
    }

    configManager.set('defaultModel', result.model);
    console.log(colors.success(`  Model updated to: ${result.model}\n`));
}

/**
 * Runs an interactive provider management wizard.
 * Allows adding, updating, or removing API providers.
 */
export async function configProviderCommand(): Promise<void> {
    if (!configManager.exists()) {
        console.log(colors.warning('No configuration found.'));
        console.log(colors.hint('Run: clai config wizard'));
        return;
    }

    const configuredProviders = PROVIDERS.filter((p) => configManager.hasApiKey(p));
    const defaultProvider = configManager.get('defaultProvider');

    const result = await runProviderManager(configuredProviders, defaultProvider);

    if (result.action === 'cancel') {
        console.log(colors.hint('\n  Cancelled.\n'));
        return;
    }

    switch (result.action) {
        case 'add':
            if (result.provider && result.apiKey && result.model) {
                configManager.setApiKey(result.provider, result.apiKey);
                configManager.set('defaultProvider', result.provider);
                configManager.set('defaultModel', result.model);
                console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[result.provider]} added and set as default!`));
                console.log(colors.hint(`  Model: ${result.model}\n`));
            }
            break;

        case 'update':
            if (result.provider && result.apiKey) {
                configManager.setApiKey(result.provider, result.apiKey);
                console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[result.provider]} API key updated!\n`));
            }
            break;

        case 'remove':
            if (result.provider) {
                configManager.removeApiKey(result.provider);
                console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[result.provider]} removed.`));

                // If new default was selected, update it
                if (result.newDefaultProvider && result.newDefaultModel) {
                    configManager.set('defaultProvider', result.newDefaultProvider);
                    configManager.set('defaultModel', result.newDefaultModel);
                    console.log(colors.success(`  Default provider changed to ${PROVIDER_DISPLAY_NAMES[result.newDefaultProvider]}`));
                    console.log(colors.hint(`  Model: ${result.newDefaultModel}`));
                } else if (result.provider === defaultProvider) {
                    // No other providers configured - warn user
                    console.log(colors.warning('  No providers configured.'));
                    console.log(colors.hint('  Run "clai config wizard" to set up a provider.'));
                }
                console.log('');
            }
            break;

        case 'default':
            if (result.provider && result.model) {
                configManager.set('defaultProvider', result.provider);
                configManager.set('defaultModel', result.model);
                console.log(colors.success(`\n  Default provider changed to ${PROVIDER_DISPLAY_NAMES[result.provider]}`));
                console.log(colors.hint(`  Model: ${result.model}\n`));
            }
            break;
    }
}
