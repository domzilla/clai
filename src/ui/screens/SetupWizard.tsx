/**
 * @file SetupWizard.tsx
 * @module src/ui/screens/SetupWizard
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview First-run setup wizard screen with combined step tabs and content view.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ApiKeyInput } from '../components/domain/ApiKeyInput.js';
import { renderAndWait } from '../utils/render.js';
import { theme, colors } from '../utils/theme.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDERS, PROVIDER_DISPLAY_NAMES } from '../../config/schema.js';
import { PROVIDER_MODELS } from '../../config/defaults.js';
import type { SetupWizardResult } from '../utils/types.js';

/** Props for the SetupWizard screen. */
interface SetupWizardScreenProps {
    /** Callback when complete. */
    onResult: (result: SetupWizardResult) => void;
}

/** Wizard steps. */
type Step = 'provider' | 'apiKey' | 'model' | 'count';

/** Step configuration. */
interface StepConfig {
    label: string;
    value: Step;
}

const STEPS: StepConfig[] = [
    { label: '1. Provider', value: 'provider' },
    { label: '2. API Key', value: 'apiKey' },
    { label: '3. Model', value: 'model' },
    { label: '4. Options', value: 'count' },
];

/**
 * Setup wizard screen component.
 * Shows step tabs and content in a combined view.
 * Use ←/→ to navigate between completed steps, ↑/↓ for selections.
 */
function SetupWizardScreen({
    onResult,
}: SetupWizardScreenProps): React.ReactElement {
    const [stepIndex, setStepIndex] = useState<number>(0);
    const [maxStepIndex, setMaxStepIndex] = useState<number>(0);
    const currentStep = STEPS[stepIndex]?.value ?? 'provider';

    // Collected values
    const [providerIndex, setProviderIndex] = useState<number>(0);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [modelIndex, setModelIndex] = useState<number>(0);
    const [model, setModel] = useState<string | null>(null);
    const [commandCount, setCommandCount] = useState<number>(3);

    const models = provider ? PROVIDER_MODELS[provider] : [];

    // Handle step navigation
    const goToStep = (index: number): void => {
        if (index <= maxStepIndex && index >= 0) {
            setStepIndex(index);
        }
    };

    const advanceToStep = (step: Step): void => {
        const newIndex = STEPS.findIndex((s) => s.value === step);
        if (newIndex > maxStepIndex) {
            setMaxStepIndex(newIndex);
        }
        setStepIndex(newIndex);
    };

    // Handle keyboard for selection steps (provider, model, count)
    useInput((_input, key) => {
        // API key step handles its own input
        if (currentStep === 'apiKey') return;

        if (key.escape) {
            if (stepIndex > 0) {
                goToStep(stepIndex - 1);
            } else {
                onResult({ completed: false });
            }
            return;
        }

        // Left/Right: navigate between completed steps
        if (key.leftArrow && stepIndex > 0) {
            goToStep(stepIndex - 1);
            return;
        }
        if (key.rightArrow && stepIndex < maxStepIndex) {
            goToStep(stepIndex + 1);
            return;
        }

        if (currentStep === 'provider') {
            if (key.upArrow) {
                setProviderIndex((prev) => (prev - 1 + PROVIDERS.length) % PROVIDERS.length);
            } else if (key.downArrow) {
                setProviderIndex((prev) => (prev + 1) % PROVIDERS.length);
            } else if (key.return) {
                const selectedProvider = PROVIDERS[providerIndex];
                if (selectedProvider) {
                    setProvider(selectedProvider);
                    advanceToStep('apiKey');
                }
            }
        } else if (currentStep === 'model') {
            if (key.upArrow) {
                setModelIndex((prev) => (prev - 1 + models.length) % models.length);
            } else if (key.downArrow) {
                setModelIndex((prev) => (prev + 1) % models.length);
            } else if (key.return) {
                const selectedModel = models[modelIndex];
                if (selectedModel) {
                    setModel(selectedModel);
                    advanceToStep('count');
                }
            }
        } else if (currentStep === 'count') {
            if (key.upArrow) {
                setCommandCount((prev) => Math.min(10, prev + 1));
            } else if (key.downArrow) {
                setCommandCount((prev) => Math.max(1, prev - 1));
            } else if (key.return) {
                onResult({
                    completed: true,
                    provider: provider!,
                    apiKey: apiKey!,
                    model: model!,
                    commandCount,
                });
            }
        }
    });

    const handleApiKeySubmit = (key: string): void => {
        setApiKey(key);
        // Reset model selection when going to model step
        setModelIndex(0);
        advanceToStep('model');
    };

    const handleApiKeyCancel = (): void => {
        if (stepIndex > 0) {
            goToStep(stepIndex - 1);
        } else {
            onResult({ completed: false });
        }
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text bold>{colors.header('Welcome to CLAI - AI-Powered Shell Command Generator')}</Text>
            </Box>

            <Box marginBottom={1}>
                <Text color={theme.colors.hint}>
                    Let's set up your configuration.
                </Text>
            </Box>

            {/* Step tabs */}
            <Box marginBottom={1}>
                <Text color={theme.colors.hint}>Step: </Text>
                {STEPS.map((step, idx) => {
                    const isSelected = idx === stepIndex;
                    const isCompleted = idx < maxStepIndex || (idx === maxStepIndex && idx < stepIndex);
                    const isAccessible = idx <= maxStepIndex;
                    return (
                        <Text key={step.value}>
                            {idx > 0 && <Text> </Text>}
                            <Text
                                bold={isSelected}
                                color={
                                    isSelected
                                        ? theme.colors.activeText
                                        : isAccessible
                                            ? theme.colors.hint
                                            : theme.colors.disabled
                                }
                                {...(isSelected && { backgroundColor: theme.colors.active })}
                            >
                                {' '}{step.label}{isCompleted ? ' ✓' : ''}{' '}
                            </Text>
                        </Text>
                    );
                })}
            </Box>

            {/* Step content */}
            <Box marginTop={1} flexDirection="column">
                {currentStep === 'provider' && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text color={theme.colors.hint}>Select your preferred AI provider:</Text>
                        </Box>
                        {PROVIDERS.map((p, idx) => {
                            const isSelected = idx === providerIndex;
                            return (
                                <Box key={p}>
                                    <Text color={isSelected ? theme.colors.active : theme.colors.inactive}>
                                        {isSelected ? '❯ ' : '  '}
                                    </Text>
                                    <Text
                                        bold={isSelected}
                                        color={isSelected ? theme.colors.active : theme.colors.inactive}
                                    >
                                        {PROVIDER_DISPLAY_NAMES[p]}
                                    </Text>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {currentStep === 'apiKey' && provider && (
                    <ApiKeyInput
                        provider={provider}
                        onSubmit={handleApiKeySubmit}
                        onCancel={handleApiKeyCancel}
                    />
                )}

                {currentStep === 'model' && provider && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text color={theme.colors.hint}>Select your default model:</Text>
                        </Box>
                        {models.map((m, idx) => {
                            const isSelected = idx === modelIndex;
                            return (
                                <Box key={m}>
                                    <Text color={isSelected ? theme.colors.active : theme.colors.inactive}>
                                        {isSelected ? '❯ ' : '  '}
                                    </Text>
                                    <Text
                                        bold={isSelected}
                                        color={isSelected ? theme.colors.active : theme.colors.inactive}
                                    >
                                        {m}
                                    </Text>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {currentStep === 'count' && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text color={theme.colors.hint}>How many command options should be generated?</Text>
                        </Box>
                        <Box>
                            <Text color={theme.colors.active}>❯ </Text>
                            <Text bold color={theme.colors.active}>
                                {commandCount}
                            </Text>
                            <Text color={theme.colors.hint}> (1-10)</Text>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Help text */}
            <Box marginTop={1}>
                <Text color={theme.colors.hint}>
                    {maxStepIndex > 0 ? '←/→ step · ' : ''}
                    {currentStep === 'apiKey'
                        ? 'Enter to submit · Esc back'
                        : currentStep === 'count'
                            ? '↑/↓ adjust · Enter confirm · Esc back'
                            : '↑/↓ select · Enter confirm · Esc back'}
                </Text>
            </Box>
        </Box>
    );
}

/**
 * Runs the setup wizard screen.
 * @returns Setup wizard result with configuration values.
 */
export async function runSetupWizard(): Promise<SetupWizardResult> {
    const result = await renderAndWait<SetupWizardResult>((context) => (
        <SetupWizardScreen
            onResult={(r) => context.resolve(r)}
        />
    ));

    return result ?? { completed: false };
}
