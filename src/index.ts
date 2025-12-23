#!/usr/bin/env node
/**
 * @file index.ts
 * @module src/index
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Entry point for the CLAI CLI application.
 * Handles startup flow and runs the setup wizard on first use.
 */

import { program } from './cli/program.js';
import { configManager } from './config/manager.js';
import { SetupWizard } from './ui/wizard.js';

/**
 * Main entry point for CLAI.
 * Runs setup wizard on first use, then parses CLI arguments.
 */
async function main(): Promise<void> {
    // Get the command being run
    const args = process.argv.slice(2);
    const firstArg = args[0];

    // Check if this is a subcommand that doesn't need config
    const noConfigCommands = ['config', 'shell', '--help', '-h', '--version', '-V'];
    const isNoConfigCommand = noConfigCommands.some((cmd) => firstArg === cmd);

    // If no valid config exists and not running a no-config command, run wizard
    if (!configManager.isConfigured() && !isNoConfigCommand) {
        const wizard = new SetupWizard(configManager);
        const completed = await wizard.run();

        if (!completed) {
            process.exit(0);
        }

        // If user ran without arguments, exit after wizard
        if (args.length === 0) {
            process.exit(0);
        }

        // Continue to execute the provided command
        console.log('Now running your command...\n');
    }

    program.parse(process.argv);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
