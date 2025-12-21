/**
 * @file detector.ts
 * @module src/system/detector
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview OS and shell detection for cross-platform support.
 */

import { platform, type, release, arch, homedir } from 'node:os';
import { execSync } from 'node:child_process';

/** Supported operating system types. */
export type OSType = 'windows' | 'macos' | 'linux';

/** Supported shell types. */
export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'unknown';

/** Complete system information for prompt context. */
export interface SystemInfo {
    /** Operating system type. */
    os: OSType;
    /** Operating system version string. */
    osVersion: string;
    /** Detected shell type. */
    shell: ShellType;
    /** Path to the shell executable. */
    shellPath: string;
    /** Node.js platform identifier. */
    platform: NodeJS.Platform;
    /** System architecture (x64, arm64, etc.). */
    arch: string;
    /** Current working directory. */
    cwd: string;
    /** User's home directory path. */
    homeDir: string;
}

/** Shell-specific syntax and path information. */
export interface ShellSpecificInfo {
    /** Command separator for chaining (&&, &). */
    commandSeparator: string;
    /** PATH environment variable separator. */
    pathSeparator: string;
    /** Line ending character(s). */
    lineEnding: string;
    /** Null device path (/dev/null, NUL). */
    nullDevice: string;
}

/**
 * Detects operating system and shell environment.
 * Provides system context for command generation.
 */
export class SystemDetector {
    /**
     * Detects complete system information.
     * @returns System information including OS, shell, and paths.
     */
    detect(): SystemInfo {
        const platformName = platform();
        const shellPath = this.detectShellPath(platformName);

        return {
            os: this.getOSName(platformName),
            osVersion: `${type()} ${release()}`,
            shell: this.getShellType(shellPath),
            shellPath,
            platform: platformName,
            arch: arch(),
            cwd: process.cwd(),
            homeDir: homedir(),
        };
    }

    private getOSName(platformName: NodeJS.Platform): OSType {
        switch (platformName) {
            case 'win32':
                return 'windows';
            case 'darwin':
                return 'macos';
            default:
                return 'linux';
        }
    }

    private detectShellPath(platformName: NodeJS.Platform): string {
        if (platformName === 'win32') {
            // Check for PowerShell
            if (process.env.PSModulePath) {
                return 'powershell';
            }
            return process.env.COMSPEC || 'cmd.exe';
        }

        // Unix-like systems
        return process.env.SHELL || '/bin/bash';
    }

    private getShellType(shellPath: string): ShellType {
        // Try to detect current shell from parent process
        const parentShell = this.getParentProcessShell();
        if (parentShell !== 'unknown') {
            return parentShell;
        }

        // Fall back to parsing shell path from $SHELL
        const shellName = shellPath.split('/').pop()?.toLowerCase() || '';

        if (shellName.includes('fish')) return 'fish';
        if (shellName.includes('zsh')) return 'zsh';
        if (shellName.includes('bash')) return 'bash';
        if (shellName.includes('powershell') || shellName.includes('pwsh')) return 'powershell';
        if (shellName.includes('cmd')) return 'cmd';

        return 'unknown';
    }

    private getParentProcessShell(): ShellType {
        try {
            const parentName = execSync(`ps -p ${process.ppid} -o comm=`, {
                encoding: 'utf-8',
            })
                .trim()
                .toLowerCase();

            // Extract just the command name (remove path if present)
            const name = parentName.split('/').pop() || '';

            if (name.includes('fish')) return 'fish';
            if (name.includes('zsh')) return 'zsh';
            if (name.includes('bash')) return 'bash';
            if (name.includes('pwsh') || name.includes('powershell')) return 'powershell';

            return 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Gets the version string of the current shell.
     * @returns Shell version string or undefined if detection fails.
     */
    getShellVersion(): string | undefined {
        const shell = this.detect().shell;

        try {
            switch (shell) {
                case 'bash':
                    return execSync('bash --version', { encoding: 'utf-8' }).split('\n')[0];
                case 'zsh':
                    return execSync('zsh --version', { encoding: 'utf-8' }).trim();
                case 'fish':
                    return execSync('fish --version', { encoding: 'utf-8' }).trim();
                case 'powershell':
                    return execSync(
                        'pwsh --version 2>/dev/null || powershell -Command "$PSVersionTable.PSVersion.ToString()"',
                        {
                            encoding: 'utf-8',
                            shell: platform() === 'win32' ? undefined : '/bin/sh',
                        },
                    ).trim();
                default:
                    return undefined;
            }
        } catch {
            return undefined;
        }
    }

    /**
     * Gets shell-specific syntax information.
     * @returns Platform-appropriate command separators and paths.
     */
    getShellSpecificInfo(): ShellSpecificInfo {
        const isWindows = platform() === 'win32';

        return {
            commandSeparator: isWindows ? ' & ' : ' && ',
            pathSeparator: isWindows ? ';' : ':',
            lineEnding: isWindows ? '\r\n' : '\n',
            nullDevice: isWindows ? 'NUL' : '/dev/null',
        };
    }

    /**
     * Gets the path to the shell's configuration file.
     * @returns Path to .bashrc, .zshrc, config.fish, or $PROFILE.
     */
    getShellConfigFile(): string {
        const info = this.detect();

        switch (info.shell) {
            case 'bash':
                return `${info.homeDir}/.bashrc`;
            case 'zsh':
                return `${info.homeDir}/.zshrc`;
            case 'fish':
                return `${info.homeDir}/.config/fish/config.fish`;
            case 'powershell':
                if (info.os === 'windows') {
                    return '$PROFILE';
                }
                return `${info.homeDir}/.config/powershell/Microsoft.PowerShell_profile.ps1`;
            default:
                return `${info.homeDir}/.bashrc`;
        }
    }
}

/** Singleton SystemDetector instance. */
export const systemDetector = new SystemDetector();
