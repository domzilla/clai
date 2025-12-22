/**
 * @file Select.tsx
 * @module src/ui/components/base/Select
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Vertical list selection component.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useKeyboardNav } from '../../hooks/useKeyboardNav.js';
import { theme } from '../../utils/theme.js';
import type { SelectItem } from '../../utils/types.js';

/** Props for the Select component. */
export interface SelectProps<T> {
    /** Array of select items. */
    items: SelectItem<T>[];
    /** Optional message/prompt to display above the list. */
    message?: string | undefined;
    /** Callback when an item is selected (Enter pressed). */
    onSelect: (value: T) => void;
    /** Callback when user cancels (Escape). */
    onCancel?: (() => void) | undefined;
    /** Initial selected index. */
    initialIndex?: number | undefined;
}

/**
 * Vertical list selection component.
 * Use up/down arrows to navigate, Enter to select, Escape to cancel.
 */
export function Select<T>({
    items,
    message,
    onSelect,
    onCancel,
    initialIndex = 0,
}: SelectProps<T>): React.ReactElement {
    const { selectedIndex } = useKeyboardNav({
        items,
        initialIndex,
        direction: 'vertical',
        loop: true,
        isDisabled: (item) => item.disabled === true,
        onSelect: (item) => onSelect(item.value),
        onCancel,
    });

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.active}>{message}</Text>
                </Box>
            )}
            {items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isDisabled = item.disabled === true;

                let color: string;
                if (isDisabled) {
                    color = theme.colors.disabled;
                } else if (isSelected) {
                    color = theme.colors.active;
                } else {
                    color = theme.colors.inactive;
                }

                return (
                    <Box key={index} flexDirection="column">
                        <Box>
                            <Text color={color}>
                                {isSelected ? theme.chars.pointer : ' '}{' '}
                            </Text>
                            <Text color={color} bold={isSelected}>
                                {item.label}
                            </Text>
                        </Box>
                        {item.description && isSelected && (
                            <Box marginLeft={3}>
                                <Text color={theme.colors.hint} dimColor>
                                    {item.description}
                                </Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
