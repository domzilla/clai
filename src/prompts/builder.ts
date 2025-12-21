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
import { SYSTEM_PROMPT_TEMPLATE, USER_PROMPT_TEMPLATE } from './templates.js';

export class PromptBuilder {
    buildSystemPrompt(systemInfo: SystemInfo, commandCount: number): string {
        return SYSTEM_PROMPT_TEMPLATE.replace('{{OS}}', systemInfo.os)
            .replace('{{OS_VERSION}}', systemInfo.osVersion)
            .replace('{{SHELL}}', systemInfo.shell)
            .replace('{{CWD}}', systemInfo.cwd)
            .replace('{{COMMAND_COUNT}}', commandCount.toString());
    }

    buildUserPrompt(userRequest: string): string {
        return USER_PROMPT_TEMPLATE.replace('{{REQUEST}}', userRequest);
    }
}

export const promptBuilder = new PromptBuilder();
