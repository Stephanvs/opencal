/**
 * Auth Login Command
 *
 * Handles authentication flow for calendar providers.
 * Currently supports Google Calendar (with Microsoft planned for future).
 */

import type { ArgumentsCamelCase } from 'yargs';

interface LoginArgs {
  provider: string;
}

export async function loginCommand(argv: ArgumentsCamelCase<LoginArgs>) {
  const provider = argv.provider;

  console.log(`\nAuthenticating with ${provider}...\n`);

  // TODO: Implement actual OAuth flow (Issue #1)
  console.log('Authentication not yet implemented.');
  console.log('This will start the OAuth flow in a future update.\n');
  console.log('Planned flow:');
  console.log('  1. Start local OAuth server');
  console.log('  2. Open browser for authorization');
  console.log('  3. Receive and store tokens\n');

  process.exit(0);
}
