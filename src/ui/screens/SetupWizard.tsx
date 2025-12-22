/**
 * @file SetupWizard.tsx
 * @module src/ui/screens/SetupWizard
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview First-run setup wizard screen.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Tabs } from '../components/base/Tabs.js';
import { ProviderSelector } from '../components/domain/ProviderSelector.js';
import { ModelSelector } from '../components/domain/ModelSelector.js';
import { ApiKeyInput } from '../components/domain/ApiKeyInput.js';
import { NumberInput } from '../components/base/NumberInput.js';
import { renderAndWait } from '../utils/render.js';
import { theme, colors } from '../utils/theme.js';
import type { Provider } from '../../config/schema.js';
import { PROVIDERS } from '../../config/schema.js';
import type { SetupWizardResult, TabItem } from '../utils/types.js';

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
 * Guides users through initial configuration.
 */
function SetupWizardScreen({
    onResult,
}: SetupWizardScreenProps): React.ReactElement {
    const [step, setStep] = useState<Step>('provider');
    const [provider, setProvider] = useState<Provider | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);

    // Build step tabs (only completed/current steps are enabled)
    const tabs: TabItem<Step>[] = STEPS.map((s, index) => {
        const currentIndex = STEPS.findIndex((st) => st.value === step);
        return {
            label: s.label,
            value: s.value,
            disabled: index > currentIndex,
        };
    });

    const handleProviderSelect = (p: Provider): void => {
        setProvider(p);
        setStep('apiKey');
    };

    const handleApiKeySubmit = (key: string): void => {
        setApiKey(key);
        setStep('model');
    };

    const handleModelSelect = (m: string): void => {
        setModel(m);
        setStep('count');
    };

    const handleCountSubmit = (count: number): void => {
        onResult({
            completed: true,
            provider: provider!,
            apiKey: apiKey!,
            model: model!,
            commandCount: count,
        });
    };

    const handleCancel = (): void => {
        // Go back to previous step, or cancel wizard
        const currentIndex = STEPS.findIndex((s) => s.value === step);
        if (currentIndex > 0) {
            const prevStep = STEPS[currentIndex - 1];
            if (prevStep) {
                setStep(prevStep.value);
            }
        } else {
            onResult({ completed: false });
        }
    };

    const handleTabChange = (newStep: Step): void => {
        // Only allow going back to completed steps
        const currentIndex = STEPS.findIndex((s) => s.value === step);
        const newIndex = STEPS.findIndex((s) => s.value === newStep);
        if (newIndex < currentIndex) {
            setStep(newStep);
        }
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text>{colors.header('Welcome to CLAI - AI-Powered Shell Command Generator')}</Text>
            </Box>

            <Box marginBottom={1}>
                <Text color={theme.colors.hint}>
                    Let's set up your configuration. Press Escape to go back.
                </Text>
            </Box>

            {/* Step indicator tabs */}
            <Box marginBottom={1}>
                <Tabs
                    tabs={tabs}
                    selected={step}
                    onChange={handleTabChange}
                    onCancel={handleCancel}
                />
            </Box>

            <Box marginTop={1}>
                {step === 'provider' && (
                    <ProviderSelector
                        providers={PROVIDERS}
                        message="Select your preferred AI provider:"
                        onSelect={handleProviderSelect}
                        onCancel={handleCancel}
                        showCancel={false}
                    />
                )}

                {step === 'apiKey' && provider && (
                    <ApiKeyInput
                        provider={provider}
                        onSubmit={handleApiKeySubmit}
                        onCancel={handleCancel}
                    />
                )}

                {step === 'model' && provider && (
                    <ModelSelector
                        provider={provider}
                        message="Select your default model:"
                        onSelect={handleModelSelect}
                        onCancel={handleCancel}
                    />
                )}

                {step === 'count' && (
                    <NumberInput
                        message="How many command options should be generated?"
                        defaultValue={3}
                        min={1}
                        max={10}
                        onSubmit={handleCountSubmit}
                        onCancel={handleCancel}
                    />
                )}
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
