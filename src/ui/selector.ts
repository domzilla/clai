/**
 * @file selector.ts
 * @module src/ui/selector
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Interactive command selection menu with risk indicators.
 */

import type { RiskLevel } from '../config/schema.js';
import type { GeneratedCommand } from '../providers/llm.js';
import { colors } from './colors.js';
import { runCommandPicker } from './screens/CommandPicker.js';

/** Risk color functions mapped to colors utility. */
export const RISK_COLORS: Record<RiskLevel, (text: string) => string> = {
    low: colors.riskLow,
    medium: colors.riskMedium,
    high: colors.riskHigh,
};

/** Unicode bullet icon for risk indicators. */
export const RISK_BULLET = '●';

/**
 * Formats a risk level as a colored bullet.
 * @param risk - The risk level to format.
 * @returns Styled risk bullet string.
 */
export function formatRiskBullet(risk: RiskLevel): string {
    return RISK_COLORS[risk](RISK_BULLET);
}

/**
 * Formats a risk level as a colored badge with icon and label.
 * @param risk - The risk level to format.
 * @returns Styled risk badge string (e.g., "● low").
 */
export function formatRiskBadge(risk: RiskLevel): string {
    return RISK_COLORS[risk](`${RISK_BULLET} ${risk}`);
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

        return runCommandPicker(commands, verbose);
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
            lines.push(`${colors.value(`${index + 1}.`)} ${colors.command(cmd.command)}`);
            lines.push(`   ${colors.hint(cmd.description)}  ${formatRiskBadge(cmd.risk)}`);

            if (verbose) {
                lines.push(`   ${colors.hint(cmd.explanation)}`);
            }

            lines.push('');
        });

        return lines.join('\n');
    }
}

/** Singleton CommandSelector instance. */
export const commandSelector = new CommandSelector();
