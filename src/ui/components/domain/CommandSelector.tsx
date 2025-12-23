/**
 * @file CommandSelector.tsx
 * @module src/ui/components/domain/CommandSelector
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Command selection component with risk indicators.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useKeyboardNav } from '../../hooks/useKeyboardNav.js';
import { theme } from '../../theme.js';
import { palette } from '../../colors.js';
import { formatRiskBullet } from '../../selector.js';
import type { GeneratedCommand } from '../../../providers/llm.js';

/** Props for the CommandSelector component. */
export interface CommandSelectorProps {
    /** Array of generated commands. */
    commands: GeneratedCommand[];
    /** Whether to show detailed explanations. */
    verbose: boolean;
    /** Callback when a command is selected. */
    onSelect: (command: GeneratedCommand) => void;
    /** Callback when user cancels. */
    onCancel?: (() => void) | undefined;
}

/** Item wrapper for keyboard navigation. */
interface CommandItem {
    command: GeneratedCommand;
    isCancel: boolean;
}

/**
 * Command selection component.
 * Displays commands with descriptions, risk levels, and optional explanations.
 */
export function CommandSelector({
    commands,
    verbose,
    onSelect,
    onCancel,
}: CommandSelectorProps): React.ReactElement {
    const items: CommandItem[] = [
        ...commands.map((command) => ({ command, isCancel: false })),
        { command: commands[0]!, isCancel: true },
    ];

    const { selectedIndex } = useKeyboardNav({
        items,
        direction: 'vertical',
        loop: true,
        onSelect: (item) => {
            if (item.isCancel) {
                onCancel?.();
            } else {
                onSelect(item.command);
            }
        },
        onCancel,
    });

    return (
        <Box flexDirection="column">
            {items.map((item, index) => {
                const isSelected = index === selectedIndex;

                if (item.isCancel) {
                    return (
                        <Box key="cancel" marginTop={1}>
                            <Text color={isSelected ? palette.active : palette.control}>
                                {isSelected ? theme.chars.pointer : ' '} Cancel
                            </Text>
                        </Box>
                    );
                }

                const { command, description, explanation, risk } = item.command;
                const riskBadge = formatRiskBullet(risk);

                return (
                    <Box key={index} flexDirection="column" marginBottom={1}>
                        <Box>
                            <Text color={isSelected ? palette.active : palette.control}>
                                {isSelected ? theme.chars.pointer : ' '}{' '}
                            </Text>
                            <Text
                                color={isSelected ? palette.active : palette.control}
                                bold={isSelected}
                            >
                                {command}
                            </Text>
                        </Box>
                        <Box marginLeft={3}>
                            <Text>{riskBadge} </Text>
                            <Text color={palette.secondaryText}>{description}</Text>
                        </Box>
                        {verbose && isSelected && explanation && (
                            <Box marginLeft={3} marginTop={0}>
                                <Text color={palette.secondaryText} dimColor>
                                    {explanation}
                                </Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
