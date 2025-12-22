/**
 * @file useKeyboardNav.ts
 * @module src/ui/hooks/useKeyboardNav
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Hook for keyboard navigation (arrows, enter, tab).
 */

import { useState, useCallback } from 'react';
import { useInput } from 'ink';

/** Options for useKeyboardNav hook. */
export interface UseKeyboardNavOptions<T> {
    /** List of items to navigate. */
    items: T[];
    /** Initial selected index. */
    initialIndex?: number | undefined;
    /** Callback when selection changes. */
    onChange?: ((item: T, index: number) => void) | undefined;
    /** Callback when item is selected (Enter pressed). */
    onSelect?: ((item: T, index: number) => void) | undefined;
    /** Callback when navigation is cancelled. */
    onCancel?: (() => void) | undefined;
    /** Navigation direction: vertical (up/down) or horizontal (left/right). */
    direction?: 'vertical' | 'horizontal' | undefined;
    /** Whether to loop at boundaries. */
    loop?: boolean | undefined;
    /** Function to check if item is disabled. */
    isDisabled?: ((item: T) => boolean) | undefined;
}

/** Return value from useKeyboardNav hook. */
export interface UseKeyboardNavReturn {
    /** Current selected index. */
    selectedIndex: number;
    /** Set the selected index manually. */
    setSelectedIndex: (index: number) => void;
}

/**
 * Hook for keyboard navigation in lists.
 * Handles arrow keys, Enter, and Escape.
 */
export function useKeyboardNav<T>(
    options: UseKeyboardNavOptions<T>,
): UseKeyboardNavReturn {
    const {
        items,
        initialIndex = 0,
        onChange,
        onSelect,
        onCancel,
        direction = 'vertical',
        loop = true,
        isDisabled,
    } = options;

    const [selectedIndex, setSelectedIndexState] = useState(initialIndex);

    const setSelectedIndex = useCallback(
        (index: number) => {
            if (index >= 0 && index < items.length) {
                const item = items[index];
                if (item !== undefined && (!isDisabled || !isDisabled(item))) {
                    setSelectedIndexState(index);
                    onChange?.(item, index);
                }
            }
        },
        [items, isDisabled, onChange],
    );

    const findNextEnabled = useCallback(
        (startIndex: number, delta: number): number => {
            let index = startIndex;
            const len = items.length;

            for (let i = 0; i < len; i++) {
                index = loop
                    ? (index + delta + len) % len
                    : Math.max(0, Math.min(len - 1, index + delta));

                const item = items[index];
                if (item !== undefined && (!isDisabled || !isDisabled(item))) {
                    return index;
                }

                if (!loop && (index === 0 || index === len - 1)) {
                    break;
                }
            }

            return startIndex;
        },
        [items, loop, isDisabled],
    );

    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            onCancel?.();
            return;
        }

        if (key.return) {
            const item = items[selectedIndex];
            if (item !== undefined && (!isDisabled || !isDisabled(item))) {
                onSelect?.(item, selectedIndex);
            }
            return;
        }

        const prevKey = direction === 'vertical' ? key.upArrow : key.leftArrow;
        const nextKey = direction === 'vertical' ? key.downArrow : key.rightArrow;

        if (prevKey) {
            const newIndex = findNextEnabled(selectedIndex, -1);
            setSelectedIndex(newIndex);
        } else if (nextKey) {
            const newIndex = findNextEnabled(selectedIndex, 1);
            setSelectedIndex(newIndex);
        }
    });

    return {
        selectedIndex,
        setSelectedIndex,
    };
}
