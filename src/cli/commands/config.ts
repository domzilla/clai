/**
 * @file config.ts
 * @module src/cli/commands/config
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Configuration management commands (show, set, reset, wizard).
 */

import { select } from '@inquirer/prompts';

import { configManager } from '../../config/manager.js';
import { SetupWizard, selectModel, selectProvider, enterApiKey } from '../../ui/wizard.js';
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
    const defaultProvider = configManager.get('defaultProvider');
    const currentModel = configManager.get('defaultModel');

    console.log(colors.header('\n  Select Model\n'));

    let provider: Provider;

    // If multiple providers configured, let user choose which one
    if (configuredProviders.length > 1) {
        console.log(colors.hint(`  Current: ${PROVIDER_DISPLAY_NAMES[defaultProvider]} / ${currentModel}\n`));

        const selectedProvider = await selectProvider({
            includeOnly: configuredProviders,
            message: 'Select provider to configure:',
        });

        if (!selectedProvider) {
            console.log(colors.hint('\n  Cancelled.\n'));
            return;
        }

        provider = selectedProvider;
    } else {
        provider = defaultProvider;
        console.log(colors.hint(`  Provider: ${PROVIDER_DISPLAY_NAMES[provider]}`));
        console.log(colors.hint(`  Current model: ${currentModel}\n`));
    }

    const model = await selectModel(
        provider,
        provider === defaultProvider ? currentModel : undefined,
    );

    if (model) {
        // If changing provider, update both provider and model
        if (provider !== defaultProvider) {
            configManager.set('defaultProvider', provider);
            console.log(colors.success(`\n  Default provider changed to: ${PROVIDER_DISPLAY_NAMES[provider]}`));
        }
        configManager.set('defaultModel', model);
        console.log(colors.success(`  Model updated to: ${model}\n`));
    } else {
        console.log(colors.hint('\n  Cancelled.\n'));
    }
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

    // Get configured providers
    const configuredProviders = PROVIDERS.filter((p) => configManager.hasApiKey(p));
    const unconfiguredProviders = PROVIDERS.filter((p) => !configManager.hasApiKey(p));

    console.log(colors.header('\n  Manage Providers\n'));
    console.log(colors.hint('  Configured providers:'));
    if (configuredProviders.length === 0) {
        console.log(colors.hint('    (none)\n'));
    } else {
        for (const p of configuredProviders) {
            console.log(`    ${colors.success('●')} ${PROVIDER_DISPLAY_NAMES[p]}`);
        }
        console.log('');
    }

    // Build action choices based on what's available
    type Action = 'add' | 'update' | 'remove' | 'default' | 'cancel';
    const actionChoices: { name: string; value: Action }[] = [];

    if (unconfiguredProviders.length > 0) {
        actionChoices.push({ name: 'Add a new provider', value: 'add' });
    }
    if (configuredProviders.length > 0) {
        actionChoices.push({ name: 'Update API key', value: 'update' });
        if (configuredProviders.length > 1) {
            actionChoices.push({ name: 'Set default provider', value: 'default' });
        }
        actionChoices.push({ name: 'Remove a provider', value: 'remove' });
    }
    actionChoices.push({ name: colors.hint('Cancel'), value: 'cancel' });

    try {
        const action = await select<Action>({
            message: 'What would you like to do?',
            choices: actionChoices,
        });

        if (action === 'cancel') {
            console.log(colors.hint('\n  Cancelled.\n'));
            return;
        }

        if (action === 'add') {
            const provider = await selectProvider({
                includeOnly: unconfiguredProviders,
                message: 'Select a provider to add:',
            });

            if (!provider) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            const apiKey = await enterApiKey(provider);

            if (!apiKey) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            configManager.setApiKey(provider, apiKey);

            // Select default model for the new provider
            console.log('');
            const model = await selectModel(provider);

            if (!model) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            // Set as default provider and model
            configManager.set('defaultProvider', provider);
            configManager.set('defaultModel', model);

            console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[provider]} added and set as default!`));
            console.log(colors.hint(`  Model: ${model}\n`));
        }

        if (action === 'default') {
            const currentDefault = configManager.get('defaultProvider');
            const provider = await selectProvider({
                includeOnly: configuredProviders,
                message: `Set default provider (current: ${PROVIDER_DISPLAY_NAMES[currentDefault]}):`,
            });

            if (!provider) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            if (provider === currentDefault) {
                console.log(colors.hint(`\n  ${PROVIDER_DISPLAY_NAMES[provider]} is already the default.\n`));
                return;
            }

            // Select model for the new default provider
            console.log('');
            const model = await selectModel(provider);

            if (!model) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            configManager.set('defaultProvider', provider);
            configManager.set('defaultModel', model);

            console.log(colors.success(`\n  Default provider changed to ${PROVIDER_DISPLAY_NAMES[provider]}`));
            console.log(colors.hint(`  Model: ${model}\n`));
        }

        if (action === 'update') {
            const provider = await selectProvider({
                includeOnly: configuredProviders,
                message: 'Select a provider to update:',
            });

            if (!provider) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            const apiKey = await enterApiKey(provider);

            if (!apiKey) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            configManager.setApiKey(provider, apiKey);
            console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[provider]} API key updated!\n`));
        }

        if (action === 'remove') {
            const provider = await selectProvider({
                includeOnly: configuredProviders,
                message: 'Select a provider to remove:',
            });

            if (!provider) {
                console.log(colors.hint('\n  Cancelled.\n'));
                return;
            }

            // Check if this is the default provider
            const defaultProvider = configManager.get('defaultProvider');
            if (provider === defaultProvider) {
                console.log(
                    colors.warning(
                        `\n  Warning: ${PROVIDER_DISPLAY_NAMES[provider]} is your default provider.`,
                    ),
                );
                console.log(colors.hint('  You may need to run "clai config wizard" to set a new default.\n'));
            }

            configManager.removeApiKey(provider);
            console.log(colors.success(`\n  ${PROVIDER_DISPLAY_NAMES[provider]} removed.\n`));
        }
    } catch {
        console.log(colors.hint('\n  Cancelled.\n'));
    }
}
