/**
 * Auth Logout Command
 *
 * Removes stored credentials for a provider (or all providers).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { readAuthStorage, getAllAccounts, removeAccount, deleteAuthStorage, hasProviderAuth, hasAnyAuth } from '@core/auth/storage';
import logger from '@core/logger';

interface LogoutArgs {
  provider?: string;
}

export async function logoutCommand(argv: ArgumentsCamelCase<LogoutArgs>) {
  const provider = argv.provider;

  if (!hasAnyAuth()) {
    logger.info('\nNo authentication data found.');
    logger.info('Nothing to logout from.\n');
    process.exit(0);
  }

  if (provider) {
    // Logout specific provider
    if (!hasProviderAuth(provider)) {
      logger.info(`\nNot authenticated with ${provider}.`);
      logger.info('Run "opencal auth list" to see authenticated providers.\n');
      process.exit(1);
    }

    // Remove all accounts for this provider
    const storage = readAuthStorage();
    const providerData = storage[provider];
    if (providerData) {
      const accountIds = Object.keys(providerData);
      for (const accountId of accountIds) {
        removeAccount(provider, accountId);
      }
    }

    // If no auth left, delete the file
    if (!hasAnyAuth()) {
      deleteAuthStorage();
    }

    logger.info(`\nLogged out from ${provider}.`);
    logger.info('All accounts have been removed.\n');
  } else {
    // Logout all providers
    deleteAuthStorage();
    logger.info('\nLogged out from all providers.');
    logger.info('All tokens have been removed.\n');
  }

  process.exit(0);
}
