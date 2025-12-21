import { platform, type, release, arch, homedir } from 'os';
import { execSync } from 'child_process';

export type OSType = 'windows' | 'macos' | 'linux';
export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'unknown';

export interface SystemInfo {
  os: OSType;
  osVersion: string;
  shell: ShellType;
  shellPath: string;
  platform: NodeJS.Platform;
  arch: string;
  cwd: string;
  homeDir: string;
}

export interface ShellSpecificInfo {
  commandSeparator: string;
  pathSeparator: string;
  lineEnding: string;
  nullDevice: string;
}

export class SystemDetector {
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
      homeDir: homedir()
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
    const shellName = shellPath.split('/').pop()?.toLowerCase() || '';

    if (shellName.includes('bash')) return 'bash';
    if (shellName.includes('zsh')) return 'zsh';
    if (shellName.includes('fish')) return 'fish';
    if (shellName.includes('powershell') || shellName.includes('pwsh')) return 'powershell';
    if (shellName.includes('cmd')) return 'cmd';

    return 'unknown';
  }

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
          return execSync('pwsh --version 2>/dev/null || powershell -Command "$PSVersionTable.PSVersion.ToString()"', {
            encoding: 'utf-8',
            shell: platform() === 'win32' ? undefined : '/bin/sh'
          }).trim();
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }

  getShellSpecificInfo(): ShellSpecificInfo {
    const isWindows = platform() === 'win32';

    return {
      commandSeparator: isWindows ? ' & ' : ' && ',
      pathSeparator: isWindows ? ';' : ':',
      lineEnding: isWindows ? '\r\n' : '\n',
      nullDevice: isWindows ? 'NUL' : '/dev/null'
    };
  }

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

export const systemDetector = new SystemDetector();
