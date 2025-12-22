/**
 * @file ModelManager.tsx
 * @module src/ui/screens/ModelManager
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Model manager screen with provider tabs.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Tabs } from '../components/base/Tabs.js';
import { ModelSelector } from '../components/domain/ModelSelector.js';
import { renderAndWait } from '../utils/render.js';
import { theme, colors } from '../utils/theme.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import type { ModelManagerResult, TabItem } from '../utils/types.js';

/** Props for the ModelManager screen. */
interface ModelManagerScreenProps {
    /** Configured providers to show tabs for. */
    configuredProviders: Provider[];
    /** Current default provider. */
    currentProvider: Provider;
    /** Current default model. */
    currentModel: string;
    /** Callback when complete. */
    onResult: (result: ModelManagerResult | null) => void;
}

/** View state for the screen. */
type ViewState = 'tabs' | 'models';

/**
 * Model manager screen component.
 * Shows provider tabs when multiple are configured, then model selection.
 */
function ModelManagerScreen({
    configuredProviders,
    currentProvider,
    currentModel,
    onResult,
}: ModelManagerScreenProps): React.ReactElement {
    const [selectedProvider, setSelectedProvider] = useState<Provider>(currentProvider);
    const [view, setView] = useState<ViewState>(
        configuredProviders.length > 1 ? 'tabs' : 'models',
    );

    const tabs: TabItem<Provider>[] = configuredProviders.map((provider) => ({
        label: PROVIDER_DISPLAY_NAMES[provider],
        value: provider,
    }));

    const handleProviderChange = (provider: Provider): void => {
        setSelectedProvider(provider);
    };

    const handleProviderConfirm = (): void => {
        setView('models');
    };

    const handleModelSelect = (model: string): void => {
        onResult({
            provider: selectedProvider,
            model,
        });
    };

    const handleCancel = (): void => {
        if (view === 'models' && configuredProviders.length > 1) {
            setView('tabs');
        } else {
            onResult(null);
        }
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text bold color={theme.colors.active}>
                    {colors.header('Select Model')}
                </Text>
            </Box>

            {configuredProviders.length > 1 && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.hint}>
                        Provider: {PROVIDER_DISPLAY_NAMES[selectedProvider]}
                        {selectedProvider === currentProvider && ' (current)'}
                    </Text>
                </Box>
            )}

            {view === 'tabs' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text color={theme.colors.hint}>
                            Use ←/→ to switch provider, Enter to select
                        </Text>
                    </Box>
                    <Tabs
                        tabs={tabs}
                        selected={selectedProvider}
                        onChange={handleProviderChange}
                        onConfirm={handleProviderConfirm}
                        onCancel={handleCancel}
                    />
                </Box>
            )}

            {view === 'models' && (
                <ModelSelector
                    provider={selectedProvider}
                    currentModel={
                        selectedProvider === currentProvider ? currentModel : undefined
                    }
                    onSelect={handleModelSelect}
                    onCancel={handleCancel}
                    message="Select your default model:"
                />
            )}
        </Box>
    );
}

/**
 * Runs the model manager screen.
 * @param configuredProviders - Providers with API keys configured.
 * @param currentProvider - Current default provider.
 * @param currentModel - Current default model.
 * @returns Selected provider and model, or null if cancelled.
 */
export async function runModelManager(
    configuredProviders: Provider[],
    currentProvider: Provider,
    currentModel: string,
): Promise<ModelManagerResult | null> {
    return renderAndWait<ModelManagerResult>((context) => (
        <ModelManagerScreen
            configuredProviders={configuredProviders}
            currentProvider={currentProvider}
            currentModel={currentModel}
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
