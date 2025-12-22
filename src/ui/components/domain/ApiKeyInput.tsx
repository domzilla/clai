/**
 * @file ApiKeyInput.tsx
 * @module src/ui/components/domain/ApiKeyInput
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview API key input component with provider URL hint.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { PasswordInput } from '../base/PasswordInput.js';
import { palette } from '../../colors.js';
import type { Provider } from '../../../config/schema.js';
import { PROVIDER_DISPLAY_NAMES } from '../../../config/schema.js';
import { PROVIDER_API_KEY_URLS } from '../../../config/defaults.js';

/** Props for the ApiKeyInput component. */
export interface ApiKeyInputProps {
    /** Provider to enter API key for. */
    provider: Provider;
    /** Callback when API key is submitted. */
    onSubmit: (apiKey: string) => void;
    /** Callback when user cancels. */
    onCancel?: (() => void) | undefined;
}

/**
 * API key input component.
 * Shows the provider's API key URL and masked password input.
 */
export function ApiKeyInput({
    provider,
    onSubmit,
    onCancel,
}: ApiKeyInputProps): React.ReactElement {
    const apiKeyUrl = PROVIDER_API_KEY_URLS[provider];
    const displayName = PROVIDER_DISPLAY_NAMES[provider];

    const validate = (value: string): string | true => {
        if (!value || value.length === 0) {
            return 'API key is required';
        }
        return true;
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                <Text color={palette.secondaryText}>
                    Get your API key at: {apiKeyUrl}
                </Text>
            </Box>
            <PasswordInput
                message={`Enter your ${displayName} API key:`}
                onSubmit={onSubmit}
                onCancel={onCancel}
                validate={validate}
            />
        </Box>
    );
}
