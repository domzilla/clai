/**
 * @file builder.ts
 * @module src/prompts/builder
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Prompt construction with system info injection.
 */

import type { SystemInfo } from '../system/detector.js';
import { SYSTEM_PROMPT_TEMPLATE, USER_PROMPT_TEMPLATE, QUIET_SYSTEM_PROMPT_TEMPLATE } from './templates.js';

/**
 * Builds prompts by interpolating system information into templates.
 */
export class PromptBuilder {
    /**
     * Builds the system prompt with injected system information.
     * @param systemInfo - Current system environment details.
     * @param commandCount - Number of commands to generate.
     * @param quiet - Use minimal prompt for quiet mode (saves tokens).
     * @returns Complete system prompt string.
     */
    buildSystemPrompt(systemInfo: SystemInfo, commandCount: number, quiet = false): string {
        if (quiet) {
            return QUIET_SYSTEM_PROMPT_TEMPLATE.replace('{{OS}}', systemInfo.os)
                .replace('{{SHELL}}', systemInfo.shell)
                .replace('{{CWD}}', systemInfo.cwd);
        }

        return SYSTEM_PROMPT_TEMPLATE.replace('{{OS}}', systemInfo.os)
            .replace('{{OS_VERSION}}', systemInfo.osVersion)
            .replace('{{SHELL}}', systemInfo.shell)
            .replace('{{CWD}}', systemInfo.cwd)
            .replace('{{COMMAND_COUNT}}', commandCount.toString());
    }

    /**
     * Builds the user prompt with the request.
     * @param userRequest - Natural language command request.
     * @returns Complete user prompt string.
     */
    buildUserPrompt(userRequest: string): string {
        return USER_PROMPT_TEMPLATE.replace('{{REQUEST}}', userRequest);
    }
}

/** Singleton PromptBuilder instance. */
export const promptBuilder = new PromptBuilder();
