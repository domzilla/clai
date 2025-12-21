/**
 * @file errors.ts
 * @module src/utils/errors
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Shared error handling utilities.
 */

import chalk from 'chalk';

/**
 * Extracts a message from an unknown error value.
 * @param error - Any caught error value.
 * @returns Error message string, or 'Unknown error' if not an Error instance.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown error';
}

/**
 * Wraps an error with additional context.
 * @param error - The original error.
 * @param context - Context description to prepend.
 * @returns New Error with prefixed message.
 */
export function wrapError(error: unknown, context: string): Error {
    return new Error(`${context}: ${getErrorMessage(error)}`);
}

/**
 * Logs an error to stderr with consistent formatting.
 * @param error - The error to log.
 */
export function logError(error: unknown): void {
    console.error(chalk.red(`Error: ${getErrorMessage(error)}`));
}
