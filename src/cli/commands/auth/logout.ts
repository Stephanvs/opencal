/**
 * Auth Logout Command
 *
 * Removes stored credentials for a provider (or all providers).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { deleteProviderTokens, deleteAuthStorage, hasProviderAuth, hasAnyAuth, type Provider } from '../../../core/auth';

interface LogoutArgs {
  provider?: string;
}

export async function logoutCommand(argv: ArgumentsCamelCase<LogoutArgs>) {
  const provider = argv.provider as Provider | undefined;

  if (!hasAnyAuth()) {
    console.log('\nNo authentication data found.');
    console.log('Nothing to logout from.\n');
    process.exit(0);
  }

  if (provider) {
    // Logout specific provider
    if (!hasProviderAuth(provider)) {
      console.log(`\nNot authenticated with ${provider}.`);
      console.log('Run "opencal auth list" to see authenticated providers.\n');
      process.exit(1);
    }

    deleteProviderTokens(provider);
    console.log(`\nLogged out from ${provider}.`);
    console.log('Tokens have been removed.\n');
  } else {
    // Logout all providers
    deleteAuthStorage();
    console.log('\nLogged out from all providers.');
    console.log('All tokens have been removed.\n');
  }

  process.exit(0);
}
