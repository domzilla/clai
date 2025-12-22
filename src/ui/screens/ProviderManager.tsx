/**
 * @file ProviderManager.tsx
 * @module src/ui/screens/ProviderManager
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Provider manager screen with action tabs.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Tabs } from '../components/base/Tabs.js';
import { ProviderSelector } from '../components/domain/ProviderSelector.js';
import { ModelSelector } from '../components/domain/ModelSelector.js';
import { ApiKeyInput } from '../components/domain/ApiKeyInput.js';
import { renderAndWait } from '../utils/render.js';
import { theme, colors } from '../utils/theme.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import type { ProviderManagerResult, TabItem } from '../utils/types.js';

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
type ViewState = 'tabs' | 'provider' | 'apiKey' | 'model';

/**
 * Provider manager screen component.
 * Shows action tabs and handles add/update/remove/default flows.
 */
function ProviderManagerScreen({
    configuredProviders,
    defaultProvider,
    onResult,
}: ProviderManagerScreenProps): React.ReactElement {
    const unconfiguredProviders = PROVIDERS.filter(
        (p) => !configuredProviders.includes(p),
    );

    const [action, setAction] = useState<Action>(
        unconfiguredProviders.length > 0 ? 'add' : 'update',
    );
    const [view, setView] = useState<ViewState>('tabs');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    // Build available tabs based on state
    const tabs: TabItem<Action>[] = [];

    if (unconfiguredProviders.length > 0) {
        tabs.push({ label: 'Add', value: 'add' });
    }
    if (configuredProviders.length > 0) {
        tabs.push({ label: 'Update', value: 'update' });
        tabs.push({ label: 'Remove', value: 'remove' });
        if (configuredProviders.length > 1) {
            tabs.push({ label: 'Set Default', value: 'default' });
        }
    }

    const handleActionChange = (newAction: Action): void => {
        setAction(newAction);
        setSelectedProvider(null);
        setApiKey(null);
    };

    const handleActionConfirm = (): void => {
        setView('provider');
    };

    const handleProviderSelect = (provider: Provider): void => {
        setSelectedProvider(provider);

        if (action === 'add' || action === 'update') {
            setView('apiKey');
        } else if (action === 'default') {
            if (provider === defaultProvider) {
                // Already default, go back
                setView('tabs');
            } else {
                setView('model');
            }
        } else if (action === 'remove') {
            onResult({
                action: 'remove',
                provider,
            });
        }
    };

    const handleApiKeySubmit = (key: string): void => {
        setApiKey(key);

        if (action === 'add') {
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
            action: action as 'add' | 'default',
            provider: selectedProvider!,
            apiKey: apiKey ?? undefined,
            model,
        });
    };

    const handleCancel = (): void => {
        if (view === 'tabs') {
            onResult({ action: 'cancel' });
        } else if (view === 'model' && action === 'add') {
            setView('apiKey');
        } else if (view === 'apiKey') {
            setView('provider');
        } else {
            setView('tabs');
        }
    };

    // Get providers list based on current action
    const getProvidersForAction = (): Provider[] => {
        switch (action) {
            case 'add':
                return unconfiguredProviders;
            case 'update':
            case 'remove':
            case 'default':
                return configuredProviders;
        }
    };

    // Get message for current action
    const getActionMessage = (): string => {
        switch (action) {
            case 'add':
                return 'Select a provider to add:';
            case 'update':
                return 'Select a provider to update:';
            case 'remove':
                return 'Select a provider to remove:';
            case 'default':
                return `Set default provider (current: ${PROVIDER_DISPLAY_NAMES[defaultProvider]}):`;
        }
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text>{colors.header('Manage Providers')}</Text>
            </Box>

            {/* Show configured providers status */}
            <Box flexDirection="column" marginBottom={1}>
                <Text color={theme.colors.hint}>Configured providers:</Text>
                {configuredProviders.length === 0 ? (
                    <Text color={theme.colors.hint}>  (none)</Text>
                ) : (
                    configuredProviders.map((p) => (
                        <Text key={p}>
                            {'  '}
                            <Text color={theme.colors.success}>●</Text>{' '}
                            {PROVIDER_DISPLAY_NAMES[p]}
                            {p === defaultProvider && (
                                <Text color={theme.colors.hint}> (default)</Text>
                            )}
                        </Text>
                    ))
                )}
            </Box>

            {view === 'tabs' && tabs.length > 0 && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.colors.hint}>
                            Use ←/→ to select action, Enter to confirm, Escape to cancel
                        </Text>
                    </Box>
                    <Tabs
                        tabs={tabs}
                        selected={action}
                        onChange={handleActionChange}
                        onConfirm={handleActionConfirm}
                        onCancel={handleCancel}
                    />
                </Box>
            )}

            {view === 'provider' && (
                <ProviderSelector
                    providers={getProvidersForAction()}
                    message={getActionMessage()}
                    onSelect={handleProviderSelect}
                    onCancel={handleCancel}
                    showCancel={false}
                />
            )}

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

            {action === 'remove' && view === 'provider' && selectedProvider === defaultProvider && (
                <Box marginTop={1}>
                    <Text color={theme.colors.warning}>
                        Warning: {PROVIDER_DISPLAY_NAMES[defaultProvider]} is your default provider.
                    </Text>
                </Box>
            )}
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
