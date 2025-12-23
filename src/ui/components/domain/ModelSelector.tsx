/**
 * @file ModelSelector.tsx
 * @module src/ui/components/domain/ModelSelector
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Model selection component for a provider.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '../base/Select.js';
import { PROVIDER_MODELS } from '../../../config/defaults.js';
import type { SelectItem } from '../../utils/types.js';

/** Props for the ModelSelector component. */
export interface ModelSelectorProps {
    /** Available models to display. Falls back to PROVIDER_MODELS if not provided. */
    models?: string[] | undefined;
    /** Currently selected model (to mark as current). */
    currentModel?: string | undefined;
    /** Callback when a model is selected. */
    onSelect: (model: string) => void;
    /** Callback when user cancels. */
    onCancel?: (() => void) | undefined;
    /** Optional message to display. */
    message?: string | undefined;
}

/**
 * Model selection component.
 * Displays available models for a provider.
 */
export function ModelSelector({
    models: modelsProp,
    currentModel,
    onSelect,
    onCancel,
    message,
}: ModelSelectorProps): React.ReactElement {
    // Use provided models or fall back to OpenAI models as default
    const models = modelsProp ?? PROVIDER_MODELS.openai;

    const items: SelectItem<string>[] = models.map((model) => ({
        label: currentModel === model ? `${model} (current)` : model,
        value: model,
    }));

    const initialIndex = currentModel ? models.indexOf(currentModel) : 0;

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text>{message}</Text>
                </Box>
            )}
            <Select
                items={items}
                onSelect={onSelect}
                onCancel={onCancel}
                initialIndex={initialIndex >= 0 ? initialIndex : 0}
            />
        </Box>
    );
}
