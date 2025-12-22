/**
 * @file PasswordInput.tsx
 * @module src/ui/components/base/PasswordInput
 * @author Dominic Rodemer
 * @created 2025-12-22
 * @license MIT
 *
 * @fileoverview Masked password input component.
 */

import React, { useState } from 'react';
import { TextInput } from './TextInput.js';

/** Props for the PasswordInput component. */
export interface PasswordInputProps {
    /** Callback when password is submitted. */
    onSubmit: (value: string) => void;
    /** Callback when user cancels (Escape). */
    onCancel?: (() => void) | undefined;
    /** Optional message/prompt to display. */
    message?: string | undefined;
    /** Validation function. Returns error message or true if valid. */
    validate?: ((value: string) => string | true) | undefined;
    /** Mask character (default: '*'). */
    maskChar?: string | undefined;
}

/**
 * Password input component with masked display.
 */
export function PasswordInput({
    onSubmit,
    onCancel,
    message,
    validate,
    maskChar = '*',
}: PasswordInputProps): React.ReactElement {
    const [value, setValue] = useState('');

    return (
        <TextInput
            value={value}
            onChange={setValue}
            onSubmit={onSubmit}
            onCancel={onCancel}
            message={message}
            validate={validate}
            mask={maskChar}
        />
    );
}
