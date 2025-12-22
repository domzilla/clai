/**
 * @file Tabs.tsx
 * @module src/ui/components/base/Tabs
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Horizontal tab navigation component.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useKeyboardNav } from '../../hooks/useKeyboardNav.js';
import { theme } from '../../utils/theme.js';
import type { TabItem } from '../../utils/types.js';

/** Props for the Tabs component. */
export interface TabsProps<T> {
    /** Array of tab items. */
    tabs: TabItem<T>[];
    /** Currently selected tab value. */
    selected: T;
    /** Callback when tab selection changes. */
    onChange: (value: T) => void;
    /** Callback when user cancels (Escape). */
    onCancel?: (() => void) | undefined;
    /** Callback when Enter is pressed on selected tab. */
    onConfirm?: ((value: T) => void) | undefined;
}

/**
 * Horizontal tab navigation component.
 * Use left/right arrows to navigate, Enter to confirm, Escape to cancel.
 */
export function Tabs<T>({
    tabs,
    selected,
    onChange,
    onCancel,
    onConfirm,
}: TabsProps<T>): React.ReactElement {
    const initialIndex = tabs.findIndex((tab) => tab.value === selected);

    useKeyboardNav({
        items: tabs,
        initialIndex: initialIndex >= 0 ? initialIndex : 0,
        direction: 'horizontal',
        loop: true,
        isDisabled: (tab) => tab.disabled === true,
        onChange: (tab) => onChange(tab.value),
        onSelect: (tab) => onConfirm?.(tab.value),
        onCancel,
    });

    return (
        <Box>
            {tabs.map((tab, index) => {
                const isSelected = tab.value === selected;
                const isDisabled = tab.disabled === true;

                let color: string;
                if (isDisabled) {
                    color = theme.colors.disabled;
                } else if (isSelected) {
                    color = theme.colors.active;
                } else {
                    color = theme.colors.inactive;
                }

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <Text color="gray">{theme.chars.tabSeparator}</Text>
                        )}
                        <Text color={color} bold={isSelected}>
                            {theme.chars.tabBracketLeft}
                            {tab.label}
                            {theme.chars.tabBracketRight}
                        </Text>
                    </React.Fragment>
                );
            })}
        </Box>
    );
}
