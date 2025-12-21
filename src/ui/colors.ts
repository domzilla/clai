/**
 * @file colors.ts
 * @module src/ui/colors
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Centralized color scheme for consistent terminal output.
 * See doc/COLOR-SCHEME.md for usage guidelines.
 */

import chalk from 'chalk';

/**
 * Centralized color functions for consistent terminal styling.
 * Use these instead of raw chalk calls throughout the codebase.
 */
export const colors = {
    // === Primary semantic colors ===

    /** Section headers and titles. */
    header: (text: string) => chalk.bold.cyan(text),

    /** Success messages and confirmations. */
    success: (text: string) => chalk.green(text),

    /** Warning messages and cautions. */
    warning: (text: string) => chalk.yellow(text),

    /** Error messages and failures. */
    error: (text: string) => chalk.red(text),

    // === Text styles ===

    /** Primary text, standard output. */
    primary: (text: string) => chalk.white(text),

    /** Secondary text, hints, tips, examples. */
    hint: (text: string) => chalk.white(text),

    /** Emphasized/important values. */
    value: (text: string) => chalk.bold(text),

    /** Labels before values. */
    label: (text: string) => chalk.white(text),

    /** Commands user should run. */
    command: (text: string) => chalk.cyan(text),

    /** Code snippets and shell scripts. */
    code: (text: string) => chalk.blue(text),

    // === Risk level colors ===

    /** Low risk indicator. */
    riskLow: (text: string) => chalk.green(text),

    /** Medium risk indicator. */
    riskMedium: (text: string) => chalk.yellow(text),

    /** High risk indicator. */
    riskHigh: (text: string) => chalk.red(text),
};
