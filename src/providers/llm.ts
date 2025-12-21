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

import type { Provider } from '../config/schema.js';
import type { SystemInfo } from '../system/detector.js';
import { configManager } from '../config/manager.js';
import { promptBuilder } from '../prompts/builder.js';

export type RiskLevel = 'low' | 'medium' | 'high';

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
            if (error instanceof Error) {
                throw new Error(`Failed to generate commands: ${error.message}`);
            }
            throw new Error('Failed to generate commands: Unknown error');
        }
    }

    private setApiKeyEnv(provider: Provider, apiKey: string): void {
        const envVarNames: Record<Provider, string> = {
            openai: 'OPENAI_API_KEY',
            anthropic: 'ANTHROPIC_API_KEY',
            gemini: 'GOOGLE_API_KEY',
            groq: 'GROQ_API_KEY',
        };

        process.env[envVarNames[provider]] = apiKey;
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
        const validRisks: RiskLevel[] = ['low', 'medium', 'high'];
        if (validRisks.includes(risk as RiskLevel)) {
            return risk as RiskLevel;
        }
        return 'medium'; // Default to medium if unknown
    }
}

export const llmProvider = new LLMProvider();
