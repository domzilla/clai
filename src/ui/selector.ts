/**
 * @file selector.ts
 * @module src/ui/selector
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Interactive command selection menu with risk indicators.
 */

import { select } from '@inquirer/prompts';
import chalk from 'chalk';

import type { RiskLevel } from '../config/schema.js';
import type { GeneratedCommand } from '../providers/llm.js';

/** Color functions for each risk level. */
const RISK_COLORS: Record<RiskLevel, (text: string) => string> = {
    low: chalk.green,
    medium: chalk.yellow,
    high: chalk.red,
};

/** Unicode icons for each risk level. */
const RISK_ICONS: Record<RiskLevel, string> = {
    low: '',
    medium: '',
    high: '',
};

/**
 * Formats a risk level as a colored badge with icon.
 * @param risk - The risk level to format.
 * @returns Styled risk badge string.
 */
function formatRiskBadge(risk: RiskLevel): string {
    const color = RISK_COLORS[risk];
    const icon = RISK_ICONS[risk];
    return color(`${icon} ${risk}`);
}

/**
 * Interactive command selection UI.
 * Displays generated commands with risk indicators and allows user selection.
 */
export class CommandSelector {
    /**
     * Presents an interactive menu for command selection.
     * @param commands - Array of generated commands to choose from.
     * @param verbose - Whether to show detailed explanations.
     * @returns Selected command or null if cancelled.
     */
    async select(
        commands: GeneratedCommand[],
        verbose: boolean = false,
    ): Promise<GeneratedCommand | null> {
        if (commands.length === 0) {
            return null;
        }

        // If only one command, still show it for confirmation
        const choices = commands.map((cmd, index) => {
            let description = `${chalk.dim(cmd.description)}`;
            if (verbose) {
                description += `\n    ${chalk.dim(cmd.explanation)}`;
            }
            description += `  ${formatRiskBadge(cmd.risk)}`;

            return {
                name: `${chalk.bold(cmd.command)}\n    ${description}`,
                value: index,
                short: cmd.command,
            };
        });

        // Add cancel option
        choices.push({
            name: chalk.dim('Cancel'),
            value: -1,
            short: 'Cancel',
        });

        const selectedIndex = await select<number>({
            message: 'Select a command:',
            choices,
        });

        if (selectedIndex === -1) {
            return null;
        }

        return commands[selectedIndex] ?? null;
    }

    /**
     * Formats commands for non-interactive display.
     * @param commands - Array of commands to format.
     * @param verbose - Whether to include detailed explanations.
     * @returns Formatted string for console output.
     */
    formatForDisplay(commands: GeneratedCommand[], verbose: boolean = false): string {
        const lines: string[] = [];

        commands.forEach((cmd, index) => {
            lines.push(`${chalk.bold.white(`${index + 1}.`)} ${chalk.cyan(cmd.command)}`);
            lines.push(`   ${chalk.dim(cmd.description)}  ${formatRiskBadge(cmd.risk)}`);

            if (verbose) {
                lines.push(`   ${chalk.dim(cmd.explanation)}`);
            }

            lines.push('');
        });

        return lines.join('\n');
    }
}

/** Singleton CommandSelector instance. */
export const commandSelector = new CommandSelector();
