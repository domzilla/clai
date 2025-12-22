/**
 * @file ModelManager.tsx
 * @module src/ui/screens/ModelManager
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Model manager screen with provider tabs and model selection.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { renderAndWait } from '../utils/render.js';
import { palette, colors } from '../colors.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import { PROVIDER_MODELS } from '../../config/defaults.js';
import type { ModelManagerResult } from '../utils/types.js';

/** Props for the ModelManager screen. */
interface ModelManagerScreenProps {
    /** Configured providers to show tabs for. */
    configuredProviders: Provider[];
    /** Current default provider. */
    defaultProvider: Provider;
    /** Current models for each provider. */
    providerModels: Record<Provider, string | undefined>;
    /** Callback when complete. */
    onResult: (result: ModelManagerResult | null) => void;
}

/**
 * Model manager screen component.
 * Shows provider tabs and model list in a combined view.
 * Use ←/→ to switch providers, ↑/↓ to select models.
 */
function ModelManagerScreen({
    configuredProviders,
    defaultProvider,
    providerModels,
    onResult,
}: ModelManagerScreenProps): React.ReactElement {
    const [providerIndex, setProviderIndex] = useState<number>(() =>
        Math.max(0, configuredProviders.indexOf(defaultProvider)),
    );
    const selectedProvider = configuredProviders[providerIndex] ?? defaultProvider;
    const models = PROVIDER_MODELS[selectedProvider];
    const currentModel = providerModels[selectedProvider];

    const [modelIndex, setModelIndex] = useState<number>(() => {
        const idx = models.indexOf(currentModel ?? '');
        return idx >= 0 ? idx : 0;
    });

    // Reset model index when provider changes
    const handleProviderChange = (newIndex: number): void => {
        setProviderIndex(newIndex);
        const newProvider = configuredProviders[newIndex];
        if (newProvider) {
            const newModels = PROVIDER_MODELS[newProvider];
            const newCurrentModel = providerModels[newProvider];
            const idx = newModels.indexOf(newCurrentModel ?? '');
            setModelIndex(idx >= 0 ? idx : 0);
        }
    };

    useInput((_input, key) => {
        if (key.escape) {
            onResult(null);
            return;
        }

        if (key.return) {
            const model = models[modelIndex];
            if (model) {
                onResult({
                    provider: selectedProvider,
                    model,
                });
            }
            return;
        }

        // Left/Right: switch provider
        if (key.leftArrow && configuredProviders.length > 1) {
            const newIndex = (providerIndex - 1 + configuredProviders.length) % configuredProviders.length;
            handleProviderChange(newIndex);
        } else if (key.rightArrow && configuredProviders.length > 1) {
            const newIndex = (providerIndex + 1) % configuredProviders.length;
            handleProviderChange(newIndex);
        }

        // Up/Down: select model
        if (key.upArrow) {
            setModelIndex((prev: number) => (prev - 1 + models.length) % models.length);
        } else if (key.downArrow) {
            setModelIndex((prev: number) => (prev + 1) % models.length);
        }
    });

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text bold>{colors.header('Select Model')}</Text>
            </Box>

            {/* Provider tabs */}
            {configuredProviders.length > 1 && (
                <Box marginBottom={1}>
                    <Text color={palette.secondaryText}>Provider: </Text>
                    {configuredProviders.map((provider: Provider, idx: number) => {
                        const isSelected = idx === providerIndex;
                        const isDefault = provider === defaultProvider;
                        return (
                            <Text key={provider}>
                                {idx > 0 && <Text> </Text>}
                                <Text
                                    bold={isSelected}
                                    color={isSelected ? palette.activeText : palette.secondaryText}
                                    {...(isSelected && { backgroundColor: palette.active })}
                                >
                                    {' '}{PROVIDER_DISPLAY_NAMES[provider]}{isDefault ? '*' : ''}{' '}
                                </Text>
                            </Text>
                        );
                    })}
                </Box>
            )}

            {/* Model list */}
            <Box flexDirection="column">
                {models.map((model: string, idx: number) => {
                    const isSelected = idx === modelIndex;
                    const isCurrent = model === currentModel;
                    return (
                        <Box key={model}>
                            <Text color={isSelected ? palette.active : palette.control}>
                                {isSelected ? '❯ ' : '  '}
                            </Text>
                            <Text
                                bold={isSelected}
                                color={isSelected ? palette.active : palette.control}
                            >
                                {model}
                            </Text>
                            {isCurrent && (
                                <Text color={palette.hint}> (current)</Text>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Help text */}
            <Box marginTop={1}>
                <Text color={palette.hint}>
                    {configuredProviders.length > 1 ? '←/→ provider · ' : ''}
                    ↑/↓ select · Enter confirm · Esc cancel
                </Text>
            </Box>
        </Box>
    );
}

/**
 * Runs the model manager screen.
 * @param configuredProviders - Providers with API keys configured.
 * @param defaultProvider - Current default provider.
 * @param providerModels - Current models for each provider.
 * @returns Selected provider and model, or null if cancelled.
 */
export async function runModelManager(
    configuredProviders: Provider[],
    defaultProvider: Provider,
    providerModels: Record<Provider, string | undefined>,
): Promise<ModelManagerResult | null> {
    return renderAndWait<ModelManagerResult>((context) => (
        <ModelManagerScreen
            configuredProviders={configuredProviders}
            defaultProvider={defaultProvider}
            providerModels={providerModels}
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
