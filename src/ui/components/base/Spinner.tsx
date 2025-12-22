/**
 * @file Spinner.tsx
 * @module src/ui/components/base/Spinner
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Loading spinner component.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../utils/theme.js';

/** Props for the Spinner component. */
export interface SpinnerProps {
    /** Text to display next to the spinner. */
    text?: string;
}

/**
 * Animated loading spinner component.
 */
export function Spinner({ text }: SpinnerProps): React.ReactElement {
    const [frameIndex, setFrameIndex] = useState(0);
    const frames = theme.chars.spinner;

    useEffect(() => {
        const timer = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % frames.length);
        }, 80);

        return () => clearInterval(timer);
    }, [frames.length]);

    return (
        <Box>
            <Text color={theme.colors.active}>{frames[frameIndex]}</Text>
            {text && (
                <Text color={theme.colors.hint}> {text}</Text>
            )}
        </Box>
    );
}
