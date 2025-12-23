/**
 * @file generate.ts
 * @module src/cli/commands/generate
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Main command generation logic.
 * Handles the workflow from prompt to command selection and output.
 */

import clipboardy from 'clipboardy';
import React from 'react';
import { render, Box } from 'ink';

import { systemDetector } from '../../system/detector.js';
import { llmProvider } from '../../providers/llm.js';
import { commandSelector } from '../../ui/selector.js';
import { configManager } from '../../config/manager.js';
import { colors } from '../../ui/colors.js';
import { logError } from '../../utils/errors.js';
import type { Provider } from '../../config/schema.js';
import { DEFAULT_MODELS, PROVIDER_MODELS } from '../../config/defaults.js';
import { Spinner } from '../../ui/components/base/Spinner.js';

/** Options for the generate command. */
export interface GenerateOptions {
    /** Override the default AI model. */
    model?: string | undefined;
    /** Override the default AI provider. */
    provider?: string | undefined;
    /** Number of commands to generate. */
    count?: string | undefined;
    /** Show detailed command explanations. */
    verbose?: boolean | undefined;
    /** Output only the command without menu. */
    quiet?: boolean | undefined;
    /** Output raw LLM response for debugging. */
    raw?: boolean | undefined;
}

/**
 * Handles the main command generation workflow.
 * Detects system info, calls AI, presents selection, and outputs result.
 * @param promptParts - Array of prompt words from CLI arguments.
 * @param options - Generation options from CLI flags.
 */
export async function generateCommand(
    promptParts: string[],
    options: GenerateOptions,
): Promise<void> {
    const prompt = promptParts.join(' ').trim();

    if (!prompt) {
        console.log(colors.warning('Missing prompt.') + ' Describe what command you need.\n');
        console.log(colors.hint('  Example: clai "list all files larger than 100MB"\n'));
        console.log(colors.hint('  Run clai -h for all options.'));
        return;
    }

    // Check if config is valid (has a provider with API key)
    if (!configManager.isConfigured()) {
        console.error(colors.warning('No provider configured. Please run the setup wizard first.'));
        console.log(colors.hint('\nRun: clai config wizard'));
        process.exit(1);
    }

    const defaultProvider = configManager.get('defaultProvider');
    const provider = (options.provider as Provider) || defaultProvider;

    // Determine model: use explicit option, or provider's configured model, or provider's default
    let model: string;
    if (options.model) {
        model = options.model;
    } else {
        model = configManager.getModel(provider) ?? DEFAULT_MODELS[provider];
    }

    // Validate model is available for the provider
    const availableModels = PROVIDER_MODELS[provider];
    if (!availableModels.includes(model)) {
        console.error(
            colors.warning(`Model '${model}' is not available for ${provider}.`),
        );
        console.log(colors.hint(`Available models: ${availableModels.join(', ')}`));
        console.log(colors.hint(`Using default: ${DEFAULT_MODELS[provider]}`));
        model = DEFAULT_MODELS[provider];
    }

    const count = options.count
        ? parseInt(options.count, 10)
        : configManager.getPreference('commandCount');
    const verbose = options.verbose ?? configManager.getPreference('showExplanations');
    const quiet = options.quiet ?? false;
    const raw = options.raw ?? false;

    // Detect system info
    const systemInfo = systemDetector.detect();

    // Show spinner while generating (render to stderr)
    const spinnerInstance = render(
        React.createElement(
            Box,
            null,
            React.createElement(Spinner, { text: 'Generating commands...' }),
        ),
        { stdout: process.stderr },
    );

    try {
        const commands = await llmProvider.generateCommands(prompt, systemInfo, {
            provider,
            model,
            count,
            raw,
            quiet,
        });

        spinnerInstance.clear();
        spinnerInstance.unmount();

        if (commands.length === 0) {
            console.error(colors.warning('No commands generated. Please try a different prompt.'));
            process.exit(1);
        }

        // In quiet mode, copy to clipboard and output the command
        if (quiet) {
            const firstCommand = commands[0];
            if (firstCommand) {
                try {
                    await clipboardy.write(firstCommand.command);
                } catch {
                    // Clipboard might not be available
                }
                console.log(firstCommand.command);
            }
            return;
        }

        // Let user select a command
        const selected = await commandSelector.select(commands, verbose);

        if (!selected) {
            // User cancelled
            process.exit(0);
        }

        // Copy to clipboard
        try {
            await clipboardy.write(selected.command);
            console.error(colors.hint('Command copied to clipboard!'));
        } catch {
            // Clipboard might not be available
            console.error(colors.hint('(Could not copy to clipboard)'));
        }

        // Output the command to stdout (for shell integration)
        console.log(selected.command);
    } catch (error) {
        spinnerInstance.clear();
        spinnerInstance.unmount();
        logError(error);
        process.exit(1);
    }
}
