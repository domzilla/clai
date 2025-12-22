/**
 * @file CommandPicker.tsx
 * @module src/ui/screens/CommandPicker
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Command picker screen for selecting generated commands.
 */

import React from 'react';
import { Box } from 'ink';
import { CommandSelector } from '../components/domain/CommandSelector.js';
import { renderAndWait } from '../utils/render.js';
import type { GeneratedCommand } from '../../providers/llm.js';
import type { CommandPickerResult } from '../utils/types.js';

/** Props for the CommandPicker screen. */
interface CommandPickerScreenProps {
    /** Array of generated commands. */
    commands: GeneratedCommand[];
    /** Whether to show detailed explanations. */
    verbose: boolean;
    /** Callback when complete. */
    onResult: (result: CommandPickerResult) => void;
}

/**
 * Command picker screen component.
 */
function CommandPickerScreen({
    commands,
    verbose,
    onResult,
}: CommandPickerScreenProps): React.ReactElement {
    return (
        <Box flexDirection="column">
            <CommandSelector
                commands={commands}
                verbose={verbose}
                onSelect={(command) => onResult(command)}
                onCancel={() => onResult(null)}
            />
        </Box>
    );
}

/**
 * Runs the command picker screen.
 * @param commands - Array of generated commands.
 * @param verbose - Whether to show detailed explanations.
 * @returns Selected command or null if cancelled.
 */
export async function runCommandPicker(
    commands: GeneratedCommand[],
    verbose: boolean,
): Promise<CommandPickerResult> {
    return renderAndWait<GeneratedCommand>((context) => (
        <CommandPickerScreen
            commands={commands}
            verbose={verbose}
            onResult={(result) => {
                if (result) {
                    context.resolve(result);
                } else {
                    context.cancel();
                }
            }}
        />
    ));
}
