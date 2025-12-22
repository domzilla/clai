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
import { theme } from '../../utils/theme.js';
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
    /** Optional message to display. */
    message?: string | undefined;
    /** Whether to show cancel option. */
    showCancel?: boolean | undefined;
}

/**
 * Provider selection component.
 * Displays a list of providers with their display names.
 */
export function ProviderSelector({
    providers,
    onSelect,
    onCancel,
    message,
    showCancel = true,
}: ProviderSelectorProps): React.ReactElement {
    const items: SelectItem<Provider | 'cancel'>[] = [
        ...providers.map((provider) => ({
            label: PROVIDER_DISPLAY_NAMES[provider],
            value: provider as Provider | 'cancel',
        })),
    ];

    if (showCancel) {
        items.push({
            label: 'Cancel',
            value: 'cancel',
        });
    }

    const handleSelect = (value: Provider | 'cancel'): void => {
        if (value === 'cancel') {
            onCancel?.();
        } else {
            onSelect(value);
        }
    };

    return (
        <Box flexDirection="column">
            {message && (
                <Box marginBottom={1}>
                    <Text color={theme.colors.active}>{message}</Text>
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
