/**
 * @file ModelManager.tsx
 * @module src/ui/screens/ModelManager
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Model manager screen with provider tabs and model selection.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Spinner } from '../components/base/Spinner.js';
import { TextInput } from '../components/base/TextInput.js';
import { renderAndWait } from '../utils/render.js';
import { palette, colors } from '../colors.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import { PROVIDER_MODELS } from '../../config/defaults.js';
import { fetchModelsForProviders, validateModelForProvider } from '../../services/model-service.js';
import type { ModelManagerResult } from '../utils/types.js';

/** Special marker for the custom model option. */
const CUSTOM_MODEL_OPTION = '[[CUSTOM]]';

/** Placeholder examples for custom model input per provider. */
const MODEL_PLACEHOLDERS: Record<Provider, string> = {
    openai: 'e.g., gpt-4-turbo',
    anthropic: 'e.g., claude-3-opus-20240229',
    gemini: 'e.g., gemini-1.5-pro',
    xai: 'e.g., grok-beta',
};

/** Props for the ModelManager screen. */
interface ModelManagerScreenProps {
    /** Configured providers to show tabs for. */
    configuredProviders: Provider[];
    /** Current default provider. */
    defaultProvider: Provider;
    /** Current models for each provider. */
    providerModels: Record<Provider, string | undefined>;
    /** Available models for each provider (dynamically fetched or fallback). */
    availableModels: Record<Provider, string[]>;
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
    availableModels,
    onResult,
}: ModelManagerScreenProps): React.ReactElement {
    const [providerIndex, setProviderIndex] = useState<number>(() =>
        Math.max(0, configuredProviders.indexOf(defaultProvider)),
    );
    const selectedProvider = configuredProviders[providerIndex] ?? defaultProvider;
    const baseModels = availableModels[selectedProvider] ?? PROVIDER_MODELS[selectedProvider];
    const models = [...baseModels, CUSTOM_MODEL_OPTION];
    const currentModel = providerModels[selectedProvider];

    const [modelIndex, setModelIndex] = useState<number>(() => {
        const idx = baseModels.indexOf(currentModel ?? '');
        return idx >= 0 ? idx : 0;
    });

    // Custom model input state
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customModel, setCustomModel] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Reset model index when provider changes
    const handleProviderChange = (newIndex: number): void => {
        setProviderIndex(newIndex);
        setIsCustomMode(false);
        setCustomModel('');
        setValidationError(null);
        const newProvider = configuredProviders[newIndex];
        if (newProvider) {
            const newModels = availableModels[newProvider] ?? PROVIDER_MODELS[newProvider];
            const newCurrentModel = providerModels[newProvider];
            const idx = newModels.indexOf(newCurrentModel ?? '');
            setModelIndex(idx >= 0 ? idx : 0);
        }
    };

    const handleCustomSubmit = async (value: string): Promise<void> => {
        const trimmed = value.trim();
        if (!trimmed) {
            setValidationError('Model name cannot be empty');
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        const isValid = await validateModelForProvider(selectedProvider, trimmed);

        setIsValidating(false);

        if (isValid === false) {
            setValidationError(
                `Model "${trimmed}" not found for ${PROVIDER_DISPLAY_NAMES[selectedProvider]}`,
            );
            return;
        }

        // Valid or couldn't validate (null) - accept the model
        onResult({
            provider: selectedProvider,
            model: trimmed,
        });
    };

    useInput((_input, key) => {
        if (isCustomMode || isValidating) return;

        if (key.escape) {
            onResult(null);
            return;
        }

        if (key.return) {
            const model = models[modelIndex];
            if (model === CUSTOM_MODEL_OPTION) {
                setIsCustomMode(true);
                return;
            }
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
            const newIndex =
                (providerIndex - 1 + configuredProviders.length) % configuredProviders.length;
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

    // Custom model input mode
    if (isCustomMode) {
        if (isValidating) {
            return (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text bold>{colors.header('Select Model')}</Text>
                    </Box>
                    <Spinner text={`Validating model "${customModel}"...`} />
                </Box>
            );
        }

        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text bold>{colors.header('Select Model')}</Text>
                </Box>
                <Box marginBottom={1}>
                    <Text color={palette.secondaryText}>
                        Enter model name for {PROVIDER_DISPLAY_NAMES[selectedProvider]}:
                    </Text>
                </Box>
                <TextInput
                    value={customModel}
                    onChange={setCustomModel}
                    onSubmit={handleCustomSubmit}
                    onCancel={() => {
                        setIsCustomMode(false);
                        setCustomModel('');
                        setValidationError(null);
                    }}
                    placeholder={MODEL_PLACEHOLDERS[selectedProvider]}
                />
                {validationError && (
                    <Box marginTop={1}>
                        <Text color={palette.error}>{validationError}</Text>
                    </Box>
                )}
                <Box marginTop={1}>
                    <Text color={palette.hint}>Enter to confirm · Esc to go back</Text>
                </Box>
            </Box>
        );
    }

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
                                    underline
                                    color={isSelected ? palette.activeText : palette.secondaryText}
                                    {...(isSelected && { backgroundColor: palette.active })}
                                >
                                    {' '}
                                    {PROVIDER_DISPLAY_NAMES[provider]}
                                    {isDefault ? '*' : ''}{' '}
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
                    const isCustomOption = model === CUSTOM_MODEL_OPTION;
                    const isCurrent = model === currentModel;
                    const displayName = isCustomOption ? 'Enter model...' : model;

                    return (
                        <Box key={model}>
                            <Text color={isSelected ? palette.active : palette.control}>
                                {isSelected ? '❯ ' : '  '}
                            </Text>
                            <Text
                                bold={isSelected}
                                color={
                                    isCustomOption
                                        ? isSelected
                                            ? palette.active
                                            : palette.hint
                                        : isSelected
                                          ? palette.active
                                          : palette.control
                                }
                                italic={isCustomOption}
                            >
                                {displayName}
                            </Text>
                            {isCurrent && <Text color={palette.hint}> (current)</Text>}
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

/** Props for the ModelManagerWrapper component. */
interface ModelManagerWrapperProps {
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
 * Wrapper component that handles model fetching with loading state.
 * Shows a spinner while fetching, then renders the model selection screen.
 */
function ModelManagerWrapper({
    configuredProviders,
    defaultProvider,
    providerModels,
    onResult,
}: ModelManagerWrapperProps): React.ReactElement {
    const [isLoading, setIsLoading] = useState(true);
    const [availableModels, setAvailableModels] = useState<Record<Provider, string[]>>(
        {} as Record<Provider, string[]>,
    );

    useEffect(() => {
        const loadModels = async (): Promise<void> => {
            const result = await fetchModelsForProviders(configuredProviders);
            setAvailableModels(result);
            setIsLoading(false);
        };

        loadModels();
    }, [configuredProviders]);

    if (isLoading) {
        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text bold>{colors.header('Select Model')}</Text>
                </Box>
                <Spinner text="Fetching available models..." />
            </Box>
        );
    }

    return (
        <ModelManagerScreen
            configuredProviders={configuredProviders}
            defaultProvider={defaultProvider}
            providerModels={providerModels}
            availableModels={availableModels}
            onResult={onResult}
        />
    );
}

/**
 * Runs the model manager screen.
 * Shows a spinner while fetching available models dynamically.
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
        <ModelManagerWrapper
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
