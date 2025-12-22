/**
 * @file colors.ts
 * @module src/ui/colors
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Centralized color scheme for consistent styling.
 * Single source of truth for all colors in the application.
 */

import chalk from 'chalk';

/**
 * Raw color values for Ink components.
 * Use with Ink's color prop: <Text color={palette.header}>
 */
export const palette = {
    // === Interactive element colors ===

    /** Active/selected item background. */
    active: 'blue',
    /** Active/selected item text (on active background). */
    activeText: 'black',
    /** Selectable/interactive items (unselected state). */
    control: 'white',
    /** Disabled/unavailable items. */
    disabled: 'gray',

    // === Text colors ===

    /** Regular display text. */
    text: 'white',
    /** Secondary text (labels, descriptions, less prominent info). */
    secondaryText: 'white',
    /** Help hints (keyboard shortcuts, footer help, inline tips like "(current)"). */
    hint: 'gray',
    /** Section headers and titles. */
    header: 'cyan',

    // === Semantic colors ===

    /** Success indicators. */
    success: 'green',
    /** Warning indicators. */
    warning: 'yellow',
    /** Error indicators. */
    error: 'red',

    // === Code colors ===

    /** Commands user should run. */
    command: 'cyan',
    /** Code snippets. */
    code: 'blue',
} as const;

/**
 * Chalk-based color functions for terminal output.
 * Use for console.log and non-Ink output: console.log(colors.header('Title'))
 */
export const colors = {
    // === Primary semantic colors ===

    /** Section headers and titles (bold + cyan). */
    header: (text: string) => chalk.bold[palette.header](text),

    /** Success messages and confirmations. */
    success: (text: string) => chalk[palette.success](text),

    /** Warning messages and cautions. */
    warning: (text: string) => chalk[palette.warning](text),

    /** Error messages and failures. */
    error: (text: string) => chalk[palette.error](text),

    // === Text styles ===

    /** Primary text, standard output. */
    primary: (text: string) => chalk[palette.text](text),

    /** Secondary text, labels, descriptions. */
    secondary: (text: string) => chalk[palette.secondaryText](text),

    /** Help hints (keyboard shortcuts, tips). */
    hint: (text: string) => chalk[palette.hint](text),

    /** Emphasized/important values. */
    value: (text: string) => chalk.bold(text),

    /** Labels before values. */
    label: (text: string) => chalk[palette.text](text),

    /** Commands user should run. */
    command: (text: string) => chalk[palette.command](text),

    /** Code snippets and shell scripts. */
    code: (text: string) => chalk[palette.code](text),

    // === Risk level colors ===

    /** Low risk indicator. */
    riskLow: (text: string) => chalk[palette.success](text),

    /** Medium risk indicator. */
    riskMedium: (text: string) => chalk[palette.warning](text),

    /** High risk indicator. */
    riskHigh: (text: string) => chalk[palette.error](text),
};
