/**
 * @file init.ts
 * @module src/cli/commands/init
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Shell integration initialization command.
 * Displays setup instructions for different shells.
 */

import chalk from 'chalk';

import { shellIntegration } from '../../shell/integration.js';
import type { ShellType } from '../../system/detector.js';

/** Shells that support integration. */
const VALID_SHELLS: ShellType[] = ['bash', 'zsh', 'fish', 'powershell'];

/**
 * Displays shell integration setup instructions.
 * @param shell - Optional shell type (auto-detects if not specified).
 */
export async function initCommand(shell?: string): Promise<void> {
    if (shell) {
        // Validate shell argument
        if (!VALID_SHELLS.includes(shell as ShellType)) {
            console.error(chalk.red(`Invalid shell: ${shell}`));
            console.log(chalk.dim(`Valid shells: ${VALID_SHELLS.join(', ')}`));
            process.exit(1);
        }

        shellIntegration.printInstructions(shell as ShellType);
    } else {
        // Auto-detect shell
        shellIntegration.printInstructions();
    }
}
