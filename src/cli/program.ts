/**
 * @file program.ts
 * @module src/cli/program
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Commander.js CLI definition with commands and options.
 */

import { Command } from 'commander';

import { generateCommand } from './commands/generate.js';
import {
    configShowCommand,
    configSetCommand,
    configResetCommand,
    configWizardCommand,
    configModelCommand,
    configProviderCommand,
} from './commands/config.js';
import { initCommand } from './commands/init.js';

/** Commander.js program instance for CLAI. */
export const program = new Command();

program.name('clai').description('AI-powered shell command generator').version('1.0.0');

// Default command: generate
program
    .argument('[prompt...]', 'Natural language description of the command')
    .option('-m, --model <model>', 'Override the default AI model')
    .option(
        '-p, --provider <provider>',
        'Override the default AI provider (openai|anthropic|gemini|xai)',
    )
    .option('-n, --count <number>', 'Number of command options to generate')
    .option('-v, --verbose', 'Show detailed command explanations')
    .option('-q, --quiet', 'Output only the command (no menu, for scripts)')
    .action(generateCommand);

// Config subcommand
const configCmd = program.command('config').description('Manage configuration');

configCmd.command('show').description('Show current configuration').action(configShowCommand);

configCmd
    .command('set <key> <value>')
    .description('Set a configuration value (provider, model, commandCount, showExplanations)')
    .action(configSetCommand);

configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .action(configResetCommand);

configCmd.command('wizard').description('Run the setup wizard').action(configWizardCommand);

configCmd.command('model').description('Select a different model').action(configModelCommand);

configCmd.command('provider').description('Add, update, or remove API providers').action(configProviderCommand);

// Init command for shell integration
program
    .command('init [shell]')
    .description('Show shell integration setup instructions')
    .action(initCommand);
