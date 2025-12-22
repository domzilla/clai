/**
 * @file theme.ts
 * @module src/ui/utils/theme
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Ink-compatible theme utilities wrapping colors.ts.
 */

import { colors } from '../colors.js';

/**
 * Theme configuration for ink components.
 * Provides consistent styling across the application.
 */
export const theme = {
    /** Colors for different UI elements. */
    colors: {
        /** Active/selected item highlight. */
        active: 'cyan',
        /** Inactive/unselected items. */
        inactive: 'white',
        /** Disabled items. */
        disabled: 'gray',
        /** Success indicators. */
        success: 'green',
        /** Warning indicators. */
        warning: 'yellow',
        /** Error indicators. */
        error: 'red',
        /** Hint text. */
        hint: 'white',
    },

    /** Characters used for UI elements. */
    chars: {
        /** Tab separator. */
        tabSeparator: '  ',
        /** Tab bracket left. */
        tabBracketLeft: '[',
        /** Tab bracket right. */
        tabBracketRight: ']',
        /** Selection pointer. */
        pointer: '>',
        /** Spinner frames. */
        spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
        /** Risk level bullet. */
        riskBullet: '●',
    },

    /** Spacing values. */
    spacing: {
        /** Indent for nested items. */
        indent: 2,
    },
} as const;

/** Re-export colors for convenience. */
export { colors };
