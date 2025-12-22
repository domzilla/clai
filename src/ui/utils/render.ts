/**
 * @file render.ts
 * @module src/ui/utils/render
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Wrapper for ink render with Promise-based result handling.
 */

import { render } from 'ink';
import type { ReactElement } from 'react';

/** Options for renderAndWait. */
export interface RenderOptions {
    /** Use stderr for output (default: true). */
    stderr?: boolean;
}

/** Context passed to components for signaling completion. */
export interface RenderContext<T> {
    /** Call to complete with a result. */
    resolve: (result: T) => void;
    /** Call to complete with cancellation. */
    cancel: () => void;
}

/**
 * Renders an ink component and waits for it to complete.
 * The component receives resolve/cancel callbacks via props to signal completion.
 *
 * @param createElement - Function that creates the element given the context.
 * @param options - Render options.
 * @returns Promise that resolves with the component's result or null if cancelled.
 */
export async function renderAndWait<T>(
    createElement: (context: RenderContext<T>) => ReactElement,
    options: RenderOptions = {},
): Promise<T | null> {
    const { stderr = true } = options;

    return new Promise((resolve) => {
        const context: RenderContext<T> = {
            resolve: (result: T) => {
                instance.unmount();
                resolve(result);
            },
            cancel: () => {
                instance.unmount();
                resolve(null);
            },
        };

        const element = createElement(context);

        const instance = render(element, {
            stdout: stderr ? process.stderr : process.stdout,
            exitOnCtrlC: false,
        });
    });
}
