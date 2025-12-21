/**
 * @file llm.ts
 * @module src/providers/llm
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview LLM.js wrapper for AI provider communication.
 */

import LLM from '@themaximalist/llm.js';

import type { Provider, RiskLevel } from '../config/schema.js';
import { RISK_LEVELS } from '../config/schema.js';
import type { SystemInfo } from '../system/detector.js';
import { configManager } from '../config/manager.js';
import { PROVIDER_ENV_VAR_NAMES } from '../config/defaults.js';
import { promptBuilder } from '../prompts/builder.js';
import { wrapError } from '../utils/errors.js';

export type { RiskLevel } from '../config/schema.js';

export interface GeneratedCommand {
    command: string;
    description: string;
    explanation: string;
    risk: RiskLevel;
}

export interface GenerateOptions {
    provider?: Provider;
    model?: string;
    count?: number;
}

interface LLMResponse {
    commands: GeneratedCommand[];
}

export class LLMProvider {
    async generateCommands(
        prompt: string,
        systemInfo: SystemInfo,
        options: GenerateOptions = {},
    ): Promise<GeneratedCommand[]> {
        const provider = options.provider || configManager.get('defaultProvider');
        const model = options.model || configManager.get('defaultModel');
        const count = options.count || configManager.getPreference('commandCount');

        const apiKey = configManager.getApiKey(provider);
        if (!apiKey) {
            throw new Error(
                `No API key configured for provider: ${provider}. Run 'clai config wizard' to set it up.`,
            );
        }

        const systemPrompt = promptBuilder.buildSystemPrompt(systemInfo, count);
        const userPrompt = promptBuilder.buildUserPrompt(prompt);

        // Set the API key in environment for LLM.js
        this.setApiKeyEnv(provider, apiKey);

        const modelIdentifier = this.getModelIdentifier(provider, model);

        try {
            // Combine system prompt and user prompt as messages
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            // Use LLM.js with JSON parser
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await (LLM as any)(fullPrompt, {
                model: modelIdentifier,
                parser: (LLM as { parsers: { json: unknown } }).parsers.json,
            });

            return this.parseResponse(response as unknown as LLMResponse);
        } catch (error) {
            throw wrapError(error, 'Failed to generate commands');
        }
    }

    private setApiKeyEnv(provider: Provider, apiKey: string): void {
        process.env[PROVIDER_ENV_VAR_NAMES[provider]] = apiKey;
    }

    private getModelIdentifier(provider: Provider, model: string): string {
        // LLM.js uses specific prefixes for different providers
        const providerPrefixes: Record<Provider, string> = {
            openai: '',
            anthropic: 'anthropic:',
            gemini: 'google:',
            groq: 'groq:',
        };

        return `${providerPrefixes[provider]}${model}`;
    }

    private parseResponse(response: LLMResponse): GeneratedCommand[] {
        if (!response || !response.commands || !Array.isArray(response.commands)) {
            throw new Error('Invalid response format from AI');
        }

        return response.commands.map((cmd) => ({
            command: cmd.command || '',
            description: cmd.description || '',
            explanation: cmd.explanation || '',
            risk: this.validateRisk(cmd.risk),
        }));
    }

    private validateRisk(risk: string): RiskLevel {
        if (RISK_LEVELS.includes(risk as RiskLevel)) {
            return risk as RiskLevel;
        }
        return 'medium'; // Default to medium if unknown
    }
}

export const llmProvider = new LLMProvider();
