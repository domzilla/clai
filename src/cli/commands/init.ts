import chalk from 'chalk';
import { shellIntegration } from '../../shell/integration.js';
import type { ShellType } from '../../system/detector.js';

const VALID_SHELLS: ShellType[] = ['bash', 'zsh', 'fish', 'powershell'];

export async function initCommand(shell?: string): Promise<void> {
  if (shell) {
    // Validate shell argument
    if (!VALID_SHELLS.includes(shell as ShellType)) {
      console.error(chalk.red(`Invalid shell: ${shell}`));
      console.log(chalk.dim(`Valid shells: ${VALID_SHELLS.join(', ')}`));
      process.exit(1);
    }

    shellIntegration.printInstructions(shell as ShellType);
  } else {
    // Auto-detect shell
    shellIntegration.printInstructions();
  }
}
