/**
 * @file wizard.ts
 * @module src/ui/wizard
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview First-run setup wizard for API key and model configuration.
 */

import { ConfigManager } from '../config/manager.js';
import { colors } from './colors.js';
import type { Provider } from '../config/schema.js';
import { runSetupWizard } from './screens/SetupWizard.js';
import { runProviderManager } from './screens/ProviderManager.js';
import { runModelManager } from './screens/ModelManager.js';
import { renderAndWait } from './utils/render.js';
import React from 'react';
import { ProviderSelector } from './components/domain/ProviderSelector.js';
import { ApiKeyInput } from './components/domain/ApiKeyInput.js';
import { ModelSelector } from './components/domain/ModelSelector.js';

/**
 * Prompts user to select a provider from available options.
 * @param options - Configuration options.
 * @param options.exclude - Providers to exclude from the list.
 * @param options.includeOnly - Only show these providers.
 * @param options.message - Custom message for the prompt.
 * @returns Selected provider, or null if cancelled.
 */
export async function selectProvider(options?: {
    exclude?: Provider[] | undefined;
    includeOnly?: Provider[] | undefined;
    message?: string | undefined;
}): Promise<Provider | null> {
    const exclude = options?.exclude ?? [];
    const includeOnly = options?.includeOnly;
    const message = options?.message ?? 'Select a provider:';

    const { PROVIDERS } = await import('../config/schema.js');

    let availableProviders = PROVIDERS.filter((p) => !exclude.includes(p));
    if (includeOnly) {
        availableProviders = availableProviders.filter((p) => includeOnly.includes(p));
    }

    if (availableProviders.length === 0) {
        return null;
    }

    return renderAndWait<Provider>((context) =>
        React.createElement(ProviderSelector, {
            providers: availableProviders,
            message,
            onSelect: (provider: Provider) => context.resolve(provider),
            onCancel: () => context.cancel(),
            showCancel: true,
        }),
    );
}

/**
 * Prompts user to enter an API key.
 * @param provider - The provider to enter the key for.
 * @returns The API key, or null if cancelled.
 */
export async function enterApiKey(provider: Provider): Promise<string | null> {
    return renderAndWait<string>((context) =>
        React.createElement(ApiKeyInput, {
            provider,
            onSubmit: (apiKey: string) => context.resolve(apiKey),
            onCancel: () => context.cancel(),
        }),
    );
}

/**
 * Prompts user to select a model from available options.
 * @param provider - The provider to show models for.
 * @param currentModel - Optional current model to mark as selected.
 * @returns Selected model string, or null if cancelled.
 */
export async function selectModel(
    provider: Provider,
    currentModel?: string | undefined,
): Promise<string | null> {
    return renderAndWait<string>((context) =>
        React.createElement(ModelSelector, {
            provider,
            currentModel,
            message: 'Select your default model:',
            onSelect: (model: string) => context.resolve(model),
            onCancel: () => context.cancel(),
        }),
    );
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
        const result = await runSetupWizard();

        if (!result.completed) {
            console.log(colors.hint('\n  Setup cancelled.\n'));
            return false;
        }

        // Save configuration
        this.config.set('defaultProvider', result.provider!);
        this.config.setApiKey(result.provider!, result.apiKey!);
        this.config.setModel(result.provider!, result.model!);
        this.config.setPreference('commandCount', result.commandCount ?? 3);

        console.log(colors.success('\n  Configuration saved successfully!'));
        console.log(colors.hint(`  Config file: ${this.config.getConfigPath()}\n`));
        console.log(colors.value('  You can now use CLAI. Try:'));
        console.log(colors.command('    clai "list all files in current directory"\n'));
        console.log(colors.hint('  For shell integration (optional), run:'));
        console.log(colors.command('    clai init\n'));

        return true;
    }
}

export { runProviderManager, runModelManager };
