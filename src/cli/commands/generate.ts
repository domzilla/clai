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

import ora from 'ora';
import chalk from 'chalk';
import clipboardy from 'clipboardy';

import { systemDetector } from '../../system/detector.js';
import { llmProvider } from '../../providers/llm.js';
import { commandSelector } from '../../ui/selector.js';
import { configManager } from '../../config/manager.js';
import { logError } from '../../utils/errors.js';
import type { Provider } from '../../config/schema.js';

/** Options for the generate command. */
export interface GenerateOptions {
    /** Override the default AI model. */
    model?: string;
    /** Override the default AI provider. */
    provider?: string;
    /** Number of commands to generate. */
    count?: string;
    /** Show detailed command explanations. */
    verbose?: boolean;
    /** Output only the command without menu. */
    quiet?: boolean;
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
        console.error(chalk.red('Error: Please provide a prompt describing the command you need.'));
        console.log(chalk.dim('\nExample: clai "list all files larger than 100MB"'));
        process.exit(1);
    }

    // Check if config exists, if not run wizard
    if (!configManager.exists()) {
        console.error(chalk.yellow('No configuration found. Please run the setup wizard first.'));
        console.log(chalk.dim('\nRun: clai config wizard'));
        process.exit(1);
    }

    const provider = (options.provider as Provider) || configManager.get('defaultProvider');
    const model = options.model || configManager.get('defaultModel');
    const count = options.count
        ? parseInt(options.count, 10)
        : configManager.getPreference('commandCount');
    const verbose = options.verbose || configManager.getPreference('showExplanations');
    const quiet = options.quiet || false;

    // Detect system info
    const systemInfo = systemDetector.detect();

    // Show spinner while generating
    const spinner = ora({
        text: 'Generating commands...',
        stream: process.stderr, // Use stderr for spinner so stdout can be captured
    }).start();

    try {
        const commands = await llmProvider.generateCommands(prompt, systemInfo, {
            provider,
            model,
            count,
        });

        spinner.stop();

        if (commands.length === 0) {
            console.error(chalk.yellow('No commands generated. Please try a different prompt.'));
            process.exit(1);
        }

        // In quiet mode, just output the first command
        if (quiet) {
            const firstCommand = commands[0];
            if (firstCommand) {
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
            console.error(chalk.dim('\nCommand copied to clipboard!'));
        } catch {
            // Clipboard might not be available
            console.error(chalk.dim('\n(Could not copy to clipboard)'));
        }

        // Output the command to stdout (for shell integration)
        console.log(selected.command);
    } catch (error) {
        spinner.stop();
        logError(error);
        process.exit(1);
    }
}
