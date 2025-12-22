/**
 * @file ProviderManager.tsx
 * @module src/ui/screens/ProviderManager
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Provider manager screen with combined action tabs and provider selection.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ModelSelector } from '../components/domain/ModelSelector.js';
import { ApiKeyInput } from '../components/domain/ApiKeyInput.js';
import { renderAndWait } from '../utils/render.js';
import { palette, colors } from '../colors.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import type { ProviderManagerResult } from '../utils/types.js';

/** Props for the ProviderManager screen. */
interface ProviderManagerScreenProps {
    /** Providers with API keys configured. */
    configuredProviders: Provider[];
    /** Current default provider. */
    defaultProvider: Provider;
    /** Callback when complete. */
    onResult: (result: ProviderManagerResult) => void;
}

/** Action types for provider management. */
type Action = 'add' | 'update' | 'remove' | 'default';

/** View states for the screen. */
type ViewState = 'main' | 'apiKey' | 'model' | 'newDefaultProvider' | 'newDefaultModel';

/** Action configuration. */
interface ActionConfig {
    label: string;
    value: Action;
}

/**
 * Provider manager screen component.
 * Shows action tabs and provider list in a combined view.
 * Use ←/→ to switch actions, ↑/↓ to select providers.
 */
function ProviderManagerScreen({
    configuredProviders,
    defaultProvider,
    onResult,
}: ProviderManagerScreenProps): React.ReactElement {
    const unconfiguredProviders = PROVIDERS.filter(
        (p) => !configuredProviders.includes(p),
    );

    // Build available actions based on state
    const actions: ActionConfig[] = [];
    if (unconfiguredProviders.length > 0) {
        actions.push({ label: 'Add', value: 'add' });
    }
    if (configuredProviders.length > 0) {
        actions.push({ label: 'Update', value: 'update' });
        actions.push({ label: 'Remove', value: 'remove' });
        if (configuredProviders.length > 1) {
            actions.push({ label: 'Set Default', value: 'default' });
        }
    }

    const [actionIndex, setActionIndex] = useState<number>(0);
    const selectedAction = actions[actionIndex]?.value ?? 'add';

    // Get providers list based on current action
    const getProvidersForAction = (action: Action): Provider[] => {
        switch (action) {
            case 'add':
                return unconfiguredProviders;
            case 'update':
            case 'remove':
                return configuredProviders;
            case 'default':
                return configuredProviders.filter((p) => p !== defaultProvider);
        }
    };

    const providers = getProvidersForAction(selectedAction);

    const [providerIndex, setProviderIndex] = useState<number>(0);
    const [view, setView] = useState<ViewState>('main');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [newDefaultProvider, setNewDefaultProvider] = useState<Provider | null>(null);
    const [newDefaultProviderIndex, setNewDefaultProviderIndex] = useState<number>(0);

    // Reset provider index when action changes
    const handleActionChange = (newIndex: number): void => {
        setActionIndex(newIndex);
        setProviderIndex(0);
    };

    useInput((_input, key) => {
        if (view !== 'main') return;

        if (key.escape) {
            onResult({ action: 'cancel' });
            return;
        }

        if (key.return) {
            const provider = providers[providerIndex];
            if (!provider) return;

            setSelectedProvider(provider);

            if (selectedAction === 'add' || selectedAction === 'update') {
                setView('apiKey');
            } else if (selectedAction === 'default') {
                onResult({
                    action: 'default',
                    provider,
                });
            } else if (selectedAction === 'remove') {
                if (provider === defaultProvider) {
                    // Removing the default provider - need to select new default
                    const remainingProviders = configuredProviders.filter((p) => p !== provider);
                    if (remainingProviders.length > 0) {
                        setView('newDefaultProvider');
                    } else {
                        // No other providers
                        onResult({
                            action: 'remove',
                            provider,
                        });
                    }
                } else {
                    onResult({
                        action: 'remove',
                        provider,
                    });
                }
            }
            return;
        }

        // Left/Right: switch action
        if (key.leftArrow && actions.length > 1) {
            const newIndex = (actionIndex - 1 + actions.length) % actions.length;
            handleActionChange(newIndex);
        } else if (key.rightArrow && actions.length > 1) {
            const newIndex = (actionIndex + 1) % actions.length;
            handleActionChange(newIndex);
        }

        // Up/Down: select provider
        if (key.upArrow && providers.length > 0) {
            setProviderIndex((prev: number) => (prev - 1 + providers.length) % providers.length);
        } else if (key.downArrow && providers.length > 0) {
            setProviderIndex((prev: number) => (prev + 1) % providers.length);
        }
    });

    const handleApiKeySubmit = (key: string): void => {
        setApiKey(key);

        if (selectedAction === 'add') {
            setView('model');
        } else {
            // Update - done after API key
            onResult({
                action: 'update',
                provider: selectedProvider!,
                apiKey: key,
            });
        }
    };

    const handleModelSelect = (model: string): void => {
        onResult({
            action: 'add',
            provider: selectedProvider!,
            apiKey: apiKey ?? undefined,
            model,
        });
    };

    const handleNewDefaultProviderSelect = (provider: Provider): void => {
        setNewDefaultProvider(provider);
        setView('newDefaultModel');
    };

    const handleNewDefaultModelSelect = (model: string): void => {
        onResult({
            action: 'remove',
            provider: selectedProvider!,
            newDefaultProvider: newDefaultProvider!,
            newDefaultModel: model,
        });
    };

    const handleCancel = (): void => {
        if (view === 'model' && selectedAction === 'add') {
            setView('apiKey');
        } else if (view === 'apiKey') {
            setView('main');
            setSelectedProvider(null);
            setApiKey(null);
        } else if (view === 'newDefaultModel') {
            setView('newDefaultProvider');
        } else if (view === 'newDefaultProvider') {
            setView('main');
            setSelectedProvider(null);
        } else {
            onResult({ action: 'cancel' });
        }
    };

    // Get remaining providers for new default selection (excluding the one being removed)
    const getRemainingProviders = (): Provider[] => {
        return configuredProviders.filter((p) => p !== selectedProvider);
    };

    // Get action hint message
    const getActionHint = (): string => {
        switch (selectedAction) {
            case 'add':
                return 'Add a new AI provider';
            case 'update':
                return 'Update API key for a provider';
            case 'remove':
                return 'Remove a configured provider';
            case 'default':
                return 'Change the default provider';
        }
    };

    if (view === 'main') {
        return (
            <Box flexDirection="column">
                <Box marginBottom={1}>
                    <Text bold>{colors.header('Manage Providers')}</Text>
                </Box>

                {/* Show configured providers status */}
                <Box flexDirection="column" marginBottom={1}>
                    <Text color={palette.secondaryText}>Configured:</Text>
                    {configuredProviders.length === 0 ? (
                        <Text color={palette.secondaryText}>  (none)</Text>
                    ) : (
                        <Text color={palette.secondaryText}>
                            {'  '}
                            {configuredProviders.map((p, idx) => (
                                <Text key={p}>
                                    {idx > 0 && ', '}
                                    {PROVIDER_DISPLAY_NAMES[p]}
                                    {p === defaultProvider && '*'}
                                </Text>
                            ))}
                        </Text>
                    )}
                </Box>

                {/* Action tabs */}
                {actions.length > 1 && (
                    <Box marginBottom={1}>
                        <Text color={palette.secondaryText}>Action: </Text>
                        {actions.map((action, idx) => {
                            const isSelected = idx === actionIndex;
                            return (
                                <Text key={action.value}>
                                    {idx > 0 && <Text> </Text>}
                                    <Text
                                        bold={isSelected}
                                        color={isSelected ? palette.activeText : palette.secondaryText}
                                        {...(isSelected && { backgroundColor: palette.active })}
                                    >
                                        {' '}{action.label}{' '}
                                    </Text>
                                </Text>
                            );
                        })}
                    </Box>
                )}

                {/* Action hint */}
                <Box marginBottom={1}>
                    <Text>{getActionHint()}</Text>
                </Box>

                {/* Provider list */}
                <Box flexDirection="column">
                    {providers.length === 0 ? (
                        <Text color={palette.secondaryText}>
                            {selectedAction === 'add'
                                ? '  All providers configured'
                                : '  No providers to show'}
                        </Text>
                    ) : (
                        providers.map((provider, idx) => {
                            const isSelected = idx === providerIndex;
                            const isDefault = provider === defaultProvider;
                            return (
                                <Box key={provider}>
                                    <Text color={isSelected ? palette.active : palette.control}>
                                        {isSelected ? '❯ ' : '  '}
                                    </Text>
                                    <Text
                                        bold={isSelected}
                                        color={isSelected ? palette.active : palette.control}
                                    >
                                        {PROVIDER_DISPLAY_NAMES[provider]}
                                    </Text>
                                    {isDefault && selectedAction !== 'default' && (
                                        <Text color={palette.hint}> (default)</Text>
                                    )}
                                </Box>
                            );
                        })
                    )}
                </Box>

                {/* Help text */}
                <Box marginTop={1}>
                    <Text color={palette.hint}>
                        {actions.length > 1 ? '←/→ action · ' : ''}
                        ↑/↓ select · Enter confirm · Esc cancel
                    </Text>
                </Box>
            </Box>
        );
    }

    // Subsequent views for multi-step flows
    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text bold>{colors.header('Manage Providers')}</Text>
            </Box>

            {view === 'apiKey' && selectedProvider && (
                <ApiKeyInput
                    provider={selectedProvider}
                    onSubmit={handleApiKeySubmit}
                    onCancel={handleCancel}
                />
            )}

            {view === 'model' && selectedProvider && (
                <ModelSelector
                    provider={selectedProvider}
                    message="Select default model:"
                    onSelect={handleModelSelect}
                    onCancel={handleCancel}
                />
            )}

            {view === 'newDefaultProvider' && selectedProvider && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={palette.warning}>
                            {PROVIDER_DISPLAY_NAMES[selectedProvider]} is your default provider.
                        </Text>
                    </Box>
                    <Box marginBottom={1}>
                        <Text>Select new default provider:</Text>
                    </Box>
                    <NewDefaultProviderSelector
                        providers={getRemainingProviders()}
                        selectedIndex={newDefaultProviderIndex}
                        onIndexChange={setNewDefaultProviderIndex}
                        onSelect={handleNewDefaultProviderSelect}
                        onCancel={handleCancel}
                        onSkip={() => {
                            onResult({
                                action: 'remove',
                                provider: selectedProvider,
                            });
                        }}
                    />
                </Box>
            )}

            {view === 'newDefaultModel' && newDefaultProvider && (
                <ModelSelector
                    provider={newDefaultProvider}
                    message={`Select default model for ${PROVIDER_DISPLAY_NAMES[newDefaultProvider]}:`}
                    onSelect={handleNewDefaultModelSelect}
                    onCancel={handleCancel}
                />
            )}
        </Box>
    );
}

/** Props for NewDefaultProviderSelector. */
interface NewDefaultProviderSelectorProps {
    providers: Provider[];
    selectedIndex: number;
    onIndexChange: (index: number) => void;
    onSelect: (provider: Provider) => void;
    onCancel: () => void;
    onSkip: () => void;
}

/**
 * Simple provider selector for new default selection.
 */
function NewDefaultProviderSelector({
    providers,
    selectedIndex,
    onIndexChange,
    onSelect,
    onCancel,
    onSkip,
}: NewDefaultProviderSelectorProps): React.ReactElement {
    useInput((_input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }

        if (key.return) {
            const provider = providers[selectedIndex];
            if (provider) {
                onSelect(provider);
            }
            return;
        }

        if (_input === 's' || _input === 'S') {
            onSkip();
            return;
        }

        if (key.upArrow) {
            onIndexChange((selectedIndex - 1 + providers.length) % providers.length);
        } else if (key.downArrow) {
            onIndexChange((selectedIndex + 1) % providers.length);
        }
    });

    return (
        <Box flexDirection="column">
            {providers.map((provider, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                    <Box key={provider}>
                        <Text color={isSelected ? palette.active : palette.control}>
                            {isSelected ? '❯ ' : '  '}
                        </Text>
                        <Text
                            bold={isSelected}
                            color={isSelected ? palette.active : palette.control}
                        >
                            {PROVIDER_DISPLAY_NAMES[provider]}
                        </Text>
                    </Box>
                );
            })}
            <Box marginTop={1}>
                <Text color={palette.hint}>
                    ↑/↓ select · Enter confirm · S skip · Esc cancel
                </Text>
            </Box>
        </Box>
    );
}

/**
 * Runs the provider manager screen.
 * @param configuredProviders - Providers with API keys configured.
 * @param defaultProvider - Current default provider.
 * @returns Provider management result.
 */
export async function runProviderManager(
    configuredProviders: Provider[],
    defaultProvider: Provider,
): Promise<ProviderManagerResult> {
    const result = await renderAndWait<ProviderManagerResult>((context) => (
        <ProviderManagerScreen
            configuredProviders={configuredProviders}
            defaultProvider={defaultProvider}
            onResult={(r) => context.resolve(r)}
        />
    ));

    return result ?? { action: 'cancel' };
}
