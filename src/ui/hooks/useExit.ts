/**
 * @file useExit.ts
 * @module src/ui/hooks/useExit
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Hook for handling Escape and Ctrl+C exit.
 */

import { useInput } from 'ink';

/**
 * Hook that calls onExit when Escape or Ctrl+C is pressed.
 * @param onExit - Callback when exit is triggered.
 */
export function useExit(onExit: () => void): void {
    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            onExit();
        }
    });
}
