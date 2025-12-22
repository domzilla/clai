/**
 * @file theme.ts
 * @module src/ui/theme
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Theme configuration for UI characters and spacing.
 */

/**
 * Theme configuration for non-color UI elements.
 */
export const theme = {
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
