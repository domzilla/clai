/**
 * @file types.ts
 * @module src/ui/utils/types
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Shared TypeScript types for ink UI components.
 */

import type { Provider } from '../../config/schema.js';
import type { GeneratedCommand } from '../../providers/llm.js';

/** Base props for components that can be cancelled. */
export interface CancellableProps {
    /** Callback when user cancels (Escape or Ctrl+C). */
    onCancel?: () => void;
}

/** Base props for components that return a result. */
export interface ResultProps<T> {
    /** Callback when component completes with a result. */
    onResult: (result: T | null) => void;
}

/** Tab item configuration. */
export interface TabItem<T> {
    /** Display label for the tab. */
    label: string;
    /** Value associated with this tab. */
    value: T;
    /** Whether the tab is disabled. */
    disabled?: boolean;
}

/** Select item configuration. */
export interface SelectItem<T> {
    /** Display label for the item. */
    label: string;
    /** Value associated with this item. */
    value: T;
    /** Optional description shown below the label. */
    description?: string;
    /** Whether the item is disabled. */
    disabled?: boolean;
}

/** Result from provider manager screen. */
export interface ProviderManagerResult {
    /** Action taken by the user. */
    action: 'add' | 'update' | 'remove' | 'default' | 'cancel';
    /** Provider affected (if applicable). */
    provider?: Provider | undefined;
    /** API key entered (if applicable). */
    apiKey?: string | undefined;
    /** Model selected (if applicable). */
    model?: string | undefined;
    /** New default provider when removing the current default. */
    newDefaultProvider?: Provider | undefined;
    /** New default model when removing the current default. */
    newDefaultModel?: string | undefined;
}

/** Result from model manager screen. */
export interface ModelManagerResult {
    /** Selected provider. */
    provider: Provider;
    /** Selected model. */
    model: string;
}

/** Result from setup wizard screen. */
export interface SetupWizardResult {
    /** Whether setup was completed. */
    completed: boolean;
    /** Selected provider. */
    provider?: Provider | undefined;
    /** API key entered. */
    apiKey?: string | undefined;
    /** Selected model. */
    model?: string | undefined;
    /** Command count preference. */
    commandCount?: number | undefined;
}

/** Result from command picker screen. */
export type CommandPickerResult = GeneratedCommand | null;
