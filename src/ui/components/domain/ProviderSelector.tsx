/**
 * @file ProviderSelector.tsx
 * @module src/ui/components/domain/ProviderSelector
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Provider selection component.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '../base/Select.js';
import { palette } from '../../colors.js';
import type { Provider } from '../../../config/schema.js';
import { PROVIDER_DISPLAY_NAMES } from '../../../config/schema.js';
import type { SelectItem } from '../../utils/types.js';

/** Props for the ProviderSelector component. */
export interface ProviderSelectorProps {
    /** Providers to display. */
    providers: Provider[];
    /** Callback when a provider is selected. */
    onSelect: (provider: Provider) => void;
    /** Callback when user cancels. */
    onCancel?: (() => void) | undefined;
    /** Callback when user skips. */
    onSkip?: (() => void) | undefined;
    /** Optional message to display. */
    message?: string | undefined;
    /** Whether to show cancel option. */
    showCancel?: boolean | undefined;
    /** Whether to show skip option. */
    showSkip?: boolean | undefined;
    /** Custom label for skip option. */
    skipLabel?: string | undefined;
}

/** Special values for provider selector. */
type SpecialValue = 'cancel' | 'skip';

/**
 * Provider selection component.
 * Displays a list of providers with their display names.
 */
export function ProviderSelector({
    providers,
    onSelect,
    onCancel,
    onSkip,
    message,
    showCancel = true,
    showSkip = false,
    skipLabel = 'Skip - choose later',
}: ProviderSelectorProps): React.ReactElement {
    const items: SelectItem<Provider | SpecialValue>[] = [
        ...providers.map((provider) => ({
            label: PROVIDER_DISPLAY_NAMES[provider],
            value: provider as Provider | SpecialValue,
        })),
    ];

    if (showSkip) {
        items.push({
            label: skipLabel,
            value: 'skip',
        });
    }

    if (showCancel) {
        items.push({
            label: 'Cancel',
            value: 'cancel',
        });
    }

    const handleSelect = (value: Provider | SpecialValue): void => {
        if (value === 'cancel') {
            onCancel?.();
        } else if (value === 'skip') {
            onSkip?.();
        } else {
            onSelect(value);
        }
    };

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text color={palette.text}>{message}</Text>
                </Box>
            )}
            <Select
                items={items}
                onSelect={handleSelect}
                onCancel={onCancel}
            />
        </Box>
    );
}
