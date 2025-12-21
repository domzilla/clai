/**
 * @file detector.test.ts
 * @module tests/unit/system/detector
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Unit tests for SystemDetector.
 */

import { SystemDetector } from '../../../src/system/detector.js';

describe('SystemDetector', () => {
    let detector: SystemDetector;

    beforeEach(() => {
        detector = new SystemDetector();
    });

    describe('detect', () => {
        it('should return system information', () => {
            const info = detector.detect();

            expect(info).toHaveProperty('os');
            expect(info).toHaveProperty('osVersion');
            expect(info).toHaveProperty('shell');
            expect(info).toHaveProperty('shellPath');
            expect(info).toHaveProperty('platform');
            expect(info).toHaveProperty('arch');
            expect(info).toHaveProperty('cwd');
            expect(info).toHaveProperty('homeDir');
        });

        it('should return valid OS type', () => {
            const info = detector.detect();
            expect(['windows', 'macos', 'linux']).toContain(info.os);
        });

        it('should return valid shell type', () => {
            const info = detector.detect();
            expect(['bash', 'zsh', 'fish', 'powershell', 'cmd', 'unknown']).toContain(info.shell);
        });

        it('should return current working directory', () => {
            const info = detector.detect();
            expect(info.cwd).toBe(process.cwd());
        });
    });

    describe('getShellSpecificInfo', () => {
        it('should return shell-specific configuration', () => {
            const info = detector.getShellSpecificInfo();

            expect(info).toHaveProperty('commandSeparator');
            expect(info).toHaveProperty('pathSeparator');
            expect(info).toHaveProperty('lineEnding');
            expect(info).toHaveProperty('nullDevice');
        });

        it('should return correct separators for the platform', () => {
            const info = detector.getShellSpecificInfo();

            if (process.platform === 'win32') {
                expect(info.commandSeparator).toBe(' & ');
                expect(info.pathSeparator).toBe(';');
                expect(info.nullDevice).toBe('NUL');
            } else {
                expect(info.commandSeparator).toBe(' && ');
                expect(info.pathSeparator).toBe(':');
                expect(info.nullDevice).toBe('/dev/null');
            }
        });
    });

    describe('getShellConfigFile', () => {
        it('should return a config file path', () => {
            const configFile = detector.getShellConfigFile();
            expect(typeof configFile).toBe('string');
            expect(configFile.length).toBeGreaterThan(0);
        });
    });
});
