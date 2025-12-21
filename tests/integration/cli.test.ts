/**
 * @file cli.test.ts
 * @module tests/integration/cli
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview CLI integration tests for command-line interface.
 */

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../../dist/index.js');

function runCli(args: string): string {
    try {
        return execSync(`node ${CLI_PATH} ${args}`, {
            encoding: 'utf-8',
            timeout: 10000,
        });
    } catch (error) {
        if (error instanceof Error && 'stdout' in error) {
            return (error as { stdout: string }).stdout;
        }
        throw error;
    }
}

describe('CLI Integration', () => {
    describe('--version', () => {
        it('should output version number', () => {
            const output = runCli('--version');
            expect(output).toMatch(/\d+\.\d+\.\d+/);
        });
    });

    describe('--help', () => {
        it('should show help information', () => {
            const output = runCli('--help');

            expect(output).toContain('clai');
            expect(output).toContain('AI-powered shell command generator');
            expect(output).toContain('--model');
            expect(output).toContain('--provider');
            expect(output).toContain('config');
            expect(output).toContain('init');
        });
    });

    describe('config --help', () => {
        it('should show config subcommand help', () => {
            const output = runCli('config --help');

            expect(output).toContain('Manage configuration');
            expect(output).toContain('show');
            expect(output).toContain('set');
            expect(output).toContain('reset');
            expect(output).toContain('wizard');
        });
    });

    describe('init', () => {
        it('should show shell integration instructions for zsh', () => {
            const output = runCli('init zsh');

            expect(output).toContain('Shell Integration Setup');
            expect(output).toContain('zsh');
            expect(output).toContain('~/.zshrc');
            expect(output).toContain('clai-widget');
            expect(output).toContain('bindkey');
        });

        it('should show shell integration instructions for bash', () => {
            const output = runCli('init bash');

            expect(output).toContain('Shell Integration Setup');
            expect(output).toContain('bash');
            expect(output).toContain('~/.bashrc');
            expect(output).toContain('clai-readline');
        });

        it('should show shell integration instructions for fish', () => {
            const output = runCli('init fish');

            expect(output).toContain('Shell Integration Setup');
            expect(output).toContain('fish');
            expect(output).toContain('config.fish');
        });

        it('should show shell integration instructions for powershell', () => {
            const output = runCli('init powershell');

            expect(output).toContain('Shell Integration Setup');
            expect(output).toContain('powershell');
            expect(output).toContain('$PROFILE');
            expect(output).toContain('Set-PSReadLineKeyHandler');
        });
    });
});
