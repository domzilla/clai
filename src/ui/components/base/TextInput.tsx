/**
 * @file TextInput.tsx
 * @module src/ui/components/base/TextInput
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Text input component with cursor.
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../theme.js';
import { palette } from '../../colors.js';

/** Props for the TextInput component. */
export interface TextInputProps {
    /** Current input value. */
    value: string;
    /** Callback when value changes. */
    onChange: (value: string) => void;
    /** Callback when Enter is pressed. */
    onSubmit: (value: string) => void;
    /** Callback when user cancels (Escape). */
    onCancel?: (() => void) | undefined;
    /** Optional placeholder text. */
    placeholder?: string | undefined;
    /** Optional message/prompt to display. */
    message?: string | undefined;
    /** Validation function. Returns error message or true if valid. */
    validate?: ((value: string) => string | true) | undefined;
    /** Whether to mask the input (for passwords). */
    mask?: string | undefined;
}

/**
 * Text input component with cursor.
 * Type to enter text, Enter to submit, Escape to cancel.
 */
export function TextInput({
    value,
    onChange,
    onSubmit,
    onCancel,
    placeholder,
    message,
    validate,
    mask,
}: TextInputProps): React.ReactElement {
    const [cursorPosition, setCursorPosition] = useState(value.length);
    const [error, setError] = useState<string | null>(null);

    const handleChange = useCallback(
        (newValue: string, newCursorPos: number) => {
            onChange(newValue);
            setCursorPosition(newCursorPos);
            setError(null);
        },
        [onChange],
    );

    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            onCancel?.();
            return;
        }

        if (key.return) {
            if (validate) {
                const result = validate(value);
                if (result !== true) {
                    setError(result);
                    return;
                }
            }
            onSubmit(value);
            return;
        }

        if (key.backspace || key.delete) {
            if (cursorPosition > 0) {
                const newValue =
                    value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
                handleChange(newValue, cursorPosition - 1);
            }
            return;
        }

        if (key.leftArrow) {
            setCursorPosition(Math.max(0, cursorPosition - 1));
            return;
        }

        if (key.rightArrow) {
            setCursorPosition(Math.min(value.length, cursorPosition + 1));
            return;
        }

        // Regular character input
        if (input && !key.ctrl && !key.meta) {
            const newValue =
                value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
            handleChange(newValue, cursorPosition + input.length);
        }
    });

    const displayValue = mask ? mask.repeat(value.length) : value;
    const showPlaceholder = value.length === 0 && placeholder;

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text color={palette.text}>{message}</Text>
                </Box>
            )}
            <Box>
                <Text color={palette.active}>{theme.chars.pointer} </Text>
                {showPlaceholder ? (
                    <Text color={palette.disabled}>{placeholder}</Text>
                ) : (
                    <>
                        <Text>{displayValue.slice(0, cursorPosition)}</Text>
                        <Text inverse>
                            {displayValue[cursorPosition] ?? ' '}
                        </Text>
                        <Text>{displayValue.slice(cursorPosition + 1)}</Text>
                    </>
                )}
            </Box>
            {error && (
                <Box marginTop={1}>
                    <Text color={palette.error}>{error}</Text>
                </Box>
            )}
        </Box>
    );
}
