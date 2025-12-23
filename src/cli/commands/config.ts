/**
 * @file config.ts
 * @module src/cli/commands/config
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Configuration management commands (show, reset, wizard, model, provider).
 */

import { configManager } from '../../config/manager.js';
import { SetupWizard, runProviderManager, runModelManager } from '../../ui/wizard.js';
import { colors } from '../../ui/colors.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';

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

    console.log(colors.header('\nclai configuration\n'));
    console.log(colors.hint(`Config file: ${configManager.getConfigPath()}\n`));

    console.log(
        colors.label('Default Provider: ') +
            colors.value(PROVIDER_DISPLAY_NAMES[config.defaultProvider]),
    );
    console.log(
        colors.label('Command count:    ') + colors.value(String(config.preferences.commandCount)),
    );
    console.log(
        colors.label('Explanations:     ') +
            colors.value(config.preferences.showExplanations ? 'Yes' : 'No'),
    );

    console.log(colors.label('\nProviders:'));
    for (const provider of PROVIDERS) {
        const hasKey = configManager.hasApiKey(provider);
        if (hasKey) {
            const model = configManager.getModelWithFallback(provider);
            const isDefault = provider === config.defaultProvider;
            const defaultMarker = isDefault ? colors.hint(' (default)') : '';
            console.log(
                `  ${colors.success('●')} ${PROVIDER_DISPLAY_NAMES[provider]}${defaultMarker}`,
            );
            console.log(`    ${colors.hint('Model:')} ${model}`);
        }
    }

    const unconfigured = PROVIDERS.filter((p) => !configManager.hasApiKey(p));
    if (unconfigured.length > 0) {
        console.log(colors.hint('\nNot configured:'));
        for (const provider of unconfigured) {
            console.log(`  ${colors.hint('○')} ${PROVIDER_DISPLAY_NAMES[provider]}`);
        }
    }

    console.log('');
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
        providerModels[provider] = configManager.getModelWithFallback(provider);
    }

    const result = await runModelManager(configuredProviders, defaultProvider, providerModels);

    if (!result) {
        console.log(colors.hint('Cancelled.'));
        return;
    }

    // Only update the model for the selected provider (don't change default provider)
    configManager.setModel(result.provider, result.model);
    console.log(
        colors.success(`${PROVIDER_DISPLAY_NAMES[result.provider]} model set to: ${result.model}`),
    );
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
        console.log(colors.hint('Cancelled.'));
        return;
    }

    switch (result.action) {
        case 'add':
            if (result.provider && result.apiKey && result.model) {
                configManager.setApiKey(result.provider, result.apiKey);
                configManager.setModel(result.provider, result.model);
                configManager.set('defaultProvider', result.provider);
                console.log(
                    colors.success(
                        `${PROVIDER_DISPLAY_NAMES[result.provider]} added and set as default!`,
                    ),
                );
                console.log(colors.hint(`Model: ${result.model}`));
            }
            break;

        case 'update':
            if (result.provider && result.apiKey) {
                configManager.setApiKey(result.provider, result.apiKey);
                console.log(
                    colors.success(`${PROVIDER_DISPLAY_NAMES[result.provider]} API key updated!`),
                );
            }
            break;

        case 'remove':
            if (result.provider) {
                configManager.removeApiKey(result.provider);
                console.log(colors.success(`${PROVIDER_DISPLAY_NAMES[result.provider]} removed.`));

                // If new default was selected, update it
                if (result.newDefaultProvider && result.newDefaultModel) {
                    configManager.set('defaultProvider', result.newDefaultProvider);
                    configManager.setModel(result.newDefaultProvider, result.newDefaultModel);
                    console.log(
                        colors.success(
                            `Default provider changed to ${PROVIDER_DISPLAY_NAMES[result.newDefaultProvider]}`,
                        ),
                    );
                    console.log(colors.hint(`Model: ${result.newDefaultModel}`));
                } else if (result.provider === defaultProvider) {
                    // No other providers configured - warn user
                    console.log(colors.warning('No providers configured.'));
                    console.log(colors.hint('Run "clai config wizard" to set up a provider.'));
                }
            }
            break;

        case 'default':
            if (result.provider) {
                configManager.set('defaultProvider', result.provider);
                console.log(
                    colors.success(
                        `Default provider changed to ${PROVIDER_DISPLAY_NAMES[result.provider]}`,
                    ),
                );
            }
            break;
    }
}
