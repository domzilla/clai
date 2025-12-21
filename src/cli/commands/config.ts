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
import { SetupWizard } from '../../ui/wizard.js';
import { colors } from '../../ui/colors.js';
import type { Provider } from '../../config/schema.js';
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

        case 'model':
            configManager.set('defaultModel', value);
            break;

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
