#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { runCommand } from './commands/run.js';

const program = new Command();

program
  .name('fusionpulse')
  .description('Generate and run Playwright E2E tests from plain English')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a FusionPulse test project')
  .action(initCommand);

program
  .command('generate')
  .description('Generate E2E test steps from a plain English description')
  .argument('<description>', 'What you want to test (e.g. "Test the login flow")')
  .option('-o, --output <file>', 'Output file path (default: test-<name>.spec.ts)')
  .option('-u, --url <url>', 'Base URL of the site to test')
  .option('-m, --model <model>', 'OpenAI model to use', 'gpt-4o-mini')
  .action(generateCommand);

program
  .command('run')
  .description('Run all FusionPulse tests in the current directory')
  .option('-f, --file <file>', 'Specific test file to run')
  .option('-h, --headed', 'Run in headed mode (show browser)')
  .action(runCommand);

program.parse();
