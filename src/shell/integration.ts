/**
 * @file integration.ts
 * @module src/shell/integration
 * @author Dominic Rodemer
 * @created 2025-12-21
 * @license MIT
 *
 * @fileoverview Shell integration snippets for bash, zsh, fish, and PowerShell.
 */

import type { ShellType } from '../system/detector.js';
import { systemDetector } from '../system/detector.js';
import { colors } from '../ui/colors.js';

/** Shell integration code snippets for each shell type. */
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

/** Configuration file paths for each shell type. */
const SHELL_CONFIG_FILES: Record<ShellType, string> = {
    zsh: '~/.zshrc',
    bash: '~/.bashrc',
    fish: '~/.config/fish/config.fish',
    powershell: '$PROFILE',
    cmd: 'N/A',
    unknown: 'N/A',
};

/** Commands to reload shell configuration for each shell type. */
const SHELL_RELOAD_COMMANDS: Partial<Record<ShellType, string>> = {
    zsh: 'source ~/.zshrc',
    bash: 'source ~/.bashrc',
    fish: 'source ~/.config/fish/config.fish',
    powershell: '. $PROFILE',
};

/**
 * Resolves the target shell, defaulting to the detected shell.
 * @param shell - Optional explicit shell type.
 * @returns The specified shell or detected current shell.
 */
function resolveTargetShell(shell?: ShellType): ShellType {
    return shell || systemDetector.detect().shell;
}

/**
 * Provides shell integration snippets and setup instructions.
 * Supports bash, zsh, fish, and PowerShell.
 */
export class ShellIntegration {
    /**
     * Gets the integration snippet for a shell.
     * @param shell - Target shell (uses detected shell if not specified).
     * @returns Shell integration code snippet.
     */
    getSnippet(shell?: ShellType): string {
        return SHELL_SNIPPETS[resolveTargetShell(shell)];
    }

    /**
     * Gets the configuration file path for a shell.
     * @param shell - Target shell (uses detected shell if not specified).
     * @returns Path to shell configuration file.
     */
    getConfigFile(shell?: ShellType): string {
        return SHELL_CONFIG_FILES[resolveTargetShell(shell)];
    }

    /**
     * Prints setup instructions to the console.
     * Displays the snippet, config file location, and usage tips.
     * @param shell - Target shell (uses detected shell if not specified).
     */
    printInstructions(shell?: ShellType): void {
        const targetShell = resolveTargetShell(shell);
        const snippet = SHELL_SNIPPETS[targetShell];
        const configFile = SHELL_CONFIG_FILES[targetShell];

        console.log(colors.header('\nShell Integration Setup\n'));

        if (targetShell === 'cmd') {
            console.log(colors.warning('CMD does not support shell integration.'));
            console.log(colors.hint('Please use PowerShell for shell integration support.\n'));
            return;
        }

        if (targetShell === 'unknown') {
            console.log(colors.warning('Shell integration is not available for your shell.'));
            console.log(
                colors.hint(
                    'You can still use clai directly - commands will be copied to clipboard.\n',
                ),
            );
            return;
        }

        console.log(colors.label('Detected shell: ') + colors.value(targetShell));
        console.log(colors.label('Config file: ') + colors.value(configFile) + '\n');

        console.log(colors.value('Step 1: Copy the following snippet:\n'));
        console.log(colors.code(snippet));

        console.log(colors.value('\nStep 2: Add it to your shell config file:'));
        console.log(
            colors.hint(`Open ${configFile} in your editor and paste the snippet at the end.\n`),
        );

        if (targetShell === 'powershell') {
            console.log(colors.hint('To open your PowerShell profile, run:'));
            console.log(colors.command('  notepad $PROFILE\n'));
        }

        console.log(colors.value('Step 3: Reload your shell:'));
        const reloadCommand = SHELL_RELOAD_COMMANDS[targetShell];
        if (reloadCommand) {
            console.log(colors.command(`  ${reloadCommand}\n`));
        }

        console.log(colors.value('Step 4: Test it:'));
        console.log(colors.hint('Type a description and press Alt+a'));
        console.log(colors.command('  list files by size') + '  →  [Alt+a]  →  ' + colors.command('ls -lhS\n'));

        console.log(colors.hint('Tip: You can customize the keybinding by changing'));
        console.log(colors.hint('\\ea (Alt+a) to another key combination:\n'));
        console.log(colors.hint('  \\C-g     = Ctrl+g'));
        console.log(colors.hint('  \\e\\C-a   = Alt+Ctrl+a'));
        console.log(colors.hint('  \\C-x\\C-a = Ctrl+x followed by Ctrl+a\n'));
    }

    /**
     * Gets the list of shells that support integration.
     * @returns Array of supported shell types.
     */
    getSupportedShells(): ShellType[] {
        return ['bash', 'zsh', 'fish', 'powershell'];
    }
}

/** Singleton ShellIntegration instance. */
export const shellIntegration = new ShellIntegration();
