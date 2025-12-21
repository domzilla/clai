/**
 * @file integration.ts
 * @module src/shell/integration
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Shell integration snippets for bash, zsh, fish, and PowerShell.
 */

import chalk from 'chalk';

import type { ShellType } from '../system/detector.js';
import { systemDetector } from '../system/detector.js';

const SHELL_SNIPPETS: Record<ShellType, string> = {
    zsh: `# CLAI - AI Command Generator
# Keybinding: Alt+a
clai-widget() {
    local cmd
    cmd=$(command clai "$BUFFER" 2>/dev/null)
    if [[ -n "$cmd" ]]; then
        BUFFER="$cmd"
        CURSOR=\${#BUFFER}
    fi
    zle redisplay
}
zle -N clai-widget
bindkey '\\ea' clai-widget`,

    bash: `# CLAI - AI Command Generator
# Keybinding: Alt+a
clai-readline() {
    local cmd
    cmd=$(command clai "$READLINE_LINE" 2>/dev/null)
    if [[ -n "$cmd" ]]; then
        READLINE_LINE="$cmd"
        READLINE_POINT=\${#READLINE_LINE}
    fi
}
bind -x '"\\ea": clai-readline'`,

    fish: `# CLAI - AI Command Generator
# Keybinding: Alt+a
function clai-widget
    set -l cmd (commandline)
    set -l result (command clai "$cmd" 2>/dev/null)
    if test -n "$result"
        commandline -r "$result"
        commandline -f repaint
    end
end

bind \\ea clai-widget`,

    powershell: `# CLAI - AI Command Generator
# Keybinding: Alt+a
Set-PSReadLineKeyHandler -Chord 'Alt+a' -ScriptBlock {
    $line = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$null)
    $result = clai $line 2>$null
    if ($result) {
        [Microsoft.PowerShell.PSConsoleReadLine]::RevertLine()
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert($result)
    }
}`,

    cmd: `:: CMD does not support shell integration.
:: Please use PowerShell for shell integration support.`,

    unknown: `# Shell integration is not available for your shell.
# You can still use clai directly and copy commands to clipboard.`,
};

const SHELL_CONFIG_FILES: Record<ShellType, string> = {
    zsh: '~/.zshrc',
    bash: '~/.bashrc',
    fish: '~/.config/fish/config.fish',
    powershell: '$PROFILE',
    cmd: 'N/A',
    unknown: 'N/A',
};

export class ShellIntegration {
    getSnippet(shell?: ShellType): string {
        const targetShell = shell || systemDetector.detect().shell;
        return SHELL_SNIPPETS[targetShell];
    }

    getConfigFile(shell?: ShellType): string {
        const targetShell = shell || systemDetector.detect().shell;
        return SHELL_CONFIG_FILES[targetShell];
    }

    printInstructions(shell?: ShellType): void {
        const targetShell = shell || systemDetector.detect().shell;
        const snippet = this.getSnippet(targetShell);
        const configFile = this.getConfigFile(targetShell);

        console.log(chalk.bold.cyan('\n  Shell Integration Setup\n'));

        if (targetShell === 'cmd') {
            console.log(chalk.yellow('  CMD does not support shell integration.'));
            console.log(chalk.dim('  Please use PowerShell for shell integration support.\n'));
            return;
        }

        if (targetShell === 'unknown') {
            console.log(chalk.yellow('  Shell integration is not available for your shell.'));
            console.log(
                chalk.dim(
                    '  You can still use clai directly - commands will be copied to clipboard.\n',
                ),
            );
            return;
        }

        console.log(chalk.white(`  Detected shell: ${chalk.bold(targetShell)}`));
        console.log(chalk.white(`  Config file: ${chalk.bold(configFile)}\n`));

        console.log(chalk.bold('  Step 1: Copy the following snippet:\n'));
        console.log(chalk.dim('  ─'.repeat(40)));
        console.log(
            chalk.green(
                snippet
                    .split('\n')
                    .map((line) => `  ${line}`)
                    .join('\n'),
            ),
        );
        console.log(chalk.dim('  ─'.repeat(40)));

        console.log(chalk.bold('\n  Step 2: Add it to your shell config file:'));
        console.log(
            chalk.dim(`  Open ${configFile} in your editor and paste the snippet at the end.\n`),
        );

        if (targetShell === 'powershell') {
            console.log(chalk.dim('  To open your PowerShell profile, run:'));
            console.log(chalk.white('    notepad $PROFILE\n'));
        }

        console.log(chalk.bold('  Step 3: Reload your shell:'));
        if (targetShell === 'zsh') {
            console.log(chalk.white('    source ~/.zshrc\n'));
        } else if (targetShell === 'bash') {
            console.log(chalk.white('    source ~/.bashrc\n'));
        } else if (targetShell === 'fish') {
            console.log(chalk.white('    source ~/.config/fish/config.fish\n'));
        } else if (targetShell === 'powershell') {
            console.log(chalk.white('    . $PROFILE\n'));
        }

        console.log(chalk.bold('  Step 4: Test it:'));
        console.log(chalk.dim('  Type a description and press Alt+a'));
        console.log(chalk.white('    list files by size  →  [Alt+a]  →  ls -lhS\n'));

        console.log(chalk.dim('  ─'.repeat(40)));
        console.log(chalk.dim('\n  Tip: You can customize the keybinding by changing'));
        console.log(chalk.dim('  \\ea (Alt+a) to another key combination:\n'));
        console.log(chalk.dim('    \\C-g     = Ctrl+g'));
        console.log(chalk.dim('    \\e\\C-a   = Alt+Ctrl+a'));
        console.log(chalk.dim('    \\C-x\\C-a = Ctrl+x followed by Ctrl+a\n'));
    }

    getSupportedShells(): ShellType[] {
        return ['bash', 'zsh', 'fish', 'powershell'];
    }
}

export const shellIntegration = new ShellIntegration();
