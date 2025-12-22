/**
 * @file NumberInput.tsx
 * @module src/ui/components/base/NumberInput
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Number input component with validation.
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../utils/theme.js';

/** Props for the NumberInput component. */
export interface NumberInputProps {
    /** Initial value. */
    defaultValue?: number | undefined;
    /** Callback when number is submitted. */
    onSubmit: (value: number) => void;
    /** Callback when user cancels (Escape). */
    onCancel?: (() => void) | undefined;
    /** Optional message/prompt to display. */
    message?: string | undefined;
    /** Minimum allowed value. */
    min?: number | undefined;
    /** Maximum allowed value. */
    max?: number | undefined;
}

/**
 * Number input component with min/max validation.
 * Use up/down arrows to increment/decrement, or type digits.
 */
export function NumberInput({
    defaultValue = 0,
    onSubmit,
    onCancel,
    message,
    min,
    max,
}: NumberInputProps): React.ReactElement {
    const [value, setValue] = useState(String(defaultValue));
    const [error, setError] = useState<string | null>(null);

    const clamp = useCallback(
        (num: number): number => {
            let result = num;
            if (min !== undefined) result = Math.max(min, result);
            if (max !== undefined) result = Math.min(max, result);
            return result;
        },
        [min, max],
    );

    const validate = useCallback(
        (numValue: number): string | null => {
            if (isNaN(numValue)) {
                return 'Please enter a valid number';
            }
            if (min !== undefined && numValue < min) {
                return `Value must be at least ${min}`;
            }
            if (max !== undefined && numValue > max) {
                return `Value must be at most ${max}`;
            }
            return null;
        },
        [min, max],
    );

    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            onCancel?.();
            return;
        }

        if (key.return) {
            const numValue = parseInt(value, 10);
            const validationError = validate(numValue);
            if (validationError) {
                setError(validationError);
                return;
            }
            onSubmit(numValue);
            return;
        }

        if (key.upArrow) {
            const numValue = parseInt(value, 10) || 0;
            const newValue = clamp(numValue + 1);
            setValue(String(newValue));
            setError(null);
            return;
        }

        if (key.downArrow) {
            const numValue = parseInt(value, 10) || 0;
            const newValue = clamp(numValue - 1);
            setValue(String(newValue));
            setError(null);
            return;
        }

        if (key.backspace || key.delete) {
            if (value.length > 0) {
                setValue(value.slice(0, -1));
                setError(null);
            }
            return;
        }

        // Only allow digits and minus sign
        if (/^[0-9-]$/.test(input)) {
            // Only allow minus at the start
            if (input === '-' && value.length > 0) {
                return;
            }
            setValue(value + input);
            setError(null);
        }
    });

    const rangeHint =
        min !== undefined && max !== undefined
            ? ` (${min}-${max})`
            : min !== undefined
              ? ` (min: ${min})`
              : max !== undefined
                ? ` (max: ${max})`
                : '';

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.active}>
                        {message}
                        <Text color={theme.colors.hint}>{rangeHint}</Text>
                    </Text>
                </Box>
            )}
            <Box>
                <Text color={theme.colors.active}>{theme.chars.pointer} </Text>
                <Text>{value}</Text>
                <Text inverse> </Text>
            </Box>
            {error && (
                <Box marginTop={1}>
                    <Text color={theme.colors.error}>{error}</Text>
                </Box>
            )}
            <Box marginTop={1}>
                <Text color={theme.colors.hint} dimColor>
                    Use ↑/↓ to adjust, Enter to confirm
                </Text>
            </Box>
        </Box>
    );
}
