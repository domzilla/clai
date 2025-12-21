#!/usr/bin/env node

import { program } from './cli/program.js';
import { configManager } from './config/manager.js';
import { SetupWizard } from './ui/wizard.js';

async function main(): Promise<void> {
  // Get the command being run
  const args = process.argv.slice(2);
  const firstArg = args[0];

  // Check if this is a subcommand that doesn't need config
  const noConfigCommands = ['config', 'init', '--help', '-h', '--version', '-V'];
  const needsConfig = !noConfigCommands.some((cmd) => firstArg === cmd);

  // If running a command that needs config and no config exists, run wizard
  if (needsConfig && !configManager.exists() && args.length > 0) {
    console.log('\n  First time setup required.\n');
    const wizard = new SetupWizard(configManager);
    await wizard.run();
    console.log('  Now running your command...\n');
  }

  program.parse(process.argv);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
