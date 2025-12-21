import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import type { GeneratedCommand, RiskLevel } from '../providers/llm.js';

const RISK_COLORS: Record<RiskLevel, (text: string) => string> = {
  low: chalk.green,
  medium: chalk.yellow,
  high: chalk.red
};

const RISK_ICONS: Record<RiskLevel, string> = {
  low: '',
  medium: '',
  high: ''
};

export class CommandSelector {
  async select(
    commands: GeneratedCommand[],
    verbose: boolean = false
  ): Promise<GeneratedCommand | null> {
    if (commands.length === 0) {
      return null;
    }

    // If only one command, still show it for confirmation
    const choices = commands.map((cmd, index) => {
      const riskColor = RISK_COLORS[cmd.risk];
      const riskIcon = RISK_ICONS[cmd.risk];

      let description = `${chalk.dim(cmd.description)}`;
      if (verbose) {
        description += `\n    ${chalk.dim(cmd.explanation)}`;
      }
      description += `  ${riskColor(`${riskIcon} ${cmd.risk}`)}`;

      return {
        name: `${chalk.bold(cmd.command)}\n    ${description}`,
        value: index,
        short: cmd.command
      };
    });

    // Add cancel option
    choices.push({
      name: chalk.dim('Cancel'),
      value: -1,
      short: 'Cancel'
    });

    const selectedIndex = await select<number>({
      message: 'Select a command:',
      choices
    });

    if (selectedIndex === -1) {
      return null;
    }

    return commands[selectedIndex];
  }

  formatForDisplay(commands: GeneratedCommand[], verbose: boolean = false): string {
    const lines: string[] = [];

    commands.forEach((cmd, index) => {
      const riskColor = RISK_COLORS[cmd.risk];
      const riskIcon = RISK_ICONS[cmd.risk];

      lines.push(`${chalk.bold.white(`${index + 1}.`)} ${chalk.cyan(cmd.command)}`);
      lines.push(`   ${chalk.dim(cmd.description)}  ${riskColor(`${riskIcon} ${cmd.risk}`)}`);

      if (verbose) {
        lines.push(`   ${chalk.dim(cmd.explanation)}`);
      }

      lines.push('');
    });

    return lines.join('\n');
  }
}

export const commandSelector = new CommandSelector();
