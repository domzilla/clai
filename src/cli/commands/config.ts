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
import { DEFAULT_MODELS, PROVIDER_MODELS } from '../../config/defaults.js';

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
        colors.label('  Default Provider: ') +
            colors.value(PROVIDER_DISPLAY_NAMES[config.defaultProvider]),
    );
    console.log(
        colors.label('  Command count:    ') + colors.value(String(config.preferences.commandCount)),
    );
    console.log(
        colors.label('  Explanations:     ') +
            colors.value(config.preferences.showExplanations ? 'Yes' : 'No'),
    );

    console.log(colors.label('\n  Providers:'));
    for (const provider of PROVIDERS) {
        const hasKey = configManager.hasApiKey(provider);
        if (hasKey) {
            const model = configManager.getModel(provider) ?? DEFAULT_MODELS[provider];
            const isDefault = provider === config.defaultProvider;
            const defaultMarker = isDefault ? colors.hint(' (default)') : '';
            console.log(`    ${colors.success('●')} ${PROVIDER_DISPLAY_NAMES[provider]}${defaultMarker}`);
            console.log(`      ${colors.hint('Model:')} ${model}`);
        }
    }

    const unconfigured = PROVIDERS.filter((p) => !configManager.hasApiKey(p));
    if (unconfigured.length > 0) {
        console.log(colors.hint('\n  Not configured:'));
        for (const provider of unconfigured) {
            console.log(`    ${colors.hint('○')} ${PROVIDER_DISPLAY_NAMES[provider]}`);
        }
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
            // Validate model exists for the current provider
            const currentProvider = configManager.get('defaultProvider');
            const currentProviderModels = PROVIDER_MODELS[currentProvider];

            if (currentProviderModels.includes(value)) {
                // Model is valid for current provider
                configManager.setModel(currentProvider, value);
            } else {
                console.error(colors.error(`Unknown model: ${value}`));
                console.log(
                    colors.hint(`Models for ${PROVIDER_DISPLAY_NAMES[currentProvider]}: ${currentProviderModels.join(', ')}`),
                );
                process.exit(1);
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
 * Shows available models for each configured provider.
 * Updates the model for the selected provider without changing the default provider.
 */
export async function configModelCommand(): Promise<void> {
    if (!configManager.exists()) {
        console.log(colors.warning('No configuration found.'));
        console.log(colors.hint('Run: clai config wizard'));
        return;
    }

    const configuredProviders = PROVIDERS.filter((p) => configManager.hasApiKey(p));
    const defaultProvider = configManager.get('defaultProvider');

    // Build map of current models for each configured provider
    const providerModels: Record<string, string | undefined> = {};
    for (const provider of configuredProviders) {
        providerModels[provider] = configManager.getModel(provider) ?? DEFAULT_MODELS[provider];
    }

    const result = await runModelManager(configuredProviders, defaultProvider, providerModels);

    if (!result) {
        console.log(colors.hint('\n  Cancelled.\n'));
        return;
    }

    // Only update the model for the selected provider (don't change default provider)
    configManager.setModel(result.provider, result.model);
    console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[result.provider]} model set to: ${result.model}\n`));
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
                configManager.setModel(result.provider, result.model);
                configManager.set('defaultProvider', result.provider);
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
                    configManager.setModel(result.newDefaultProvider, result.newDefaultModel);
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
            if (result.provider) {
                configManager.set('defaultProvider', result.provider);
                console.log(colors.success(`\n  Default provider changed to ${PROVIDER_DISPLAY_NAMES[result.provider]}\n`));
            }
            break;
    }
}
