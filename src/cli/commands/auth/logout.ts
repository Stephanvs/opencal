/**
 * Auth Logout Command
 *
 * Removes stored credentials for a provider (or all providers).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { deleteProviderTokens, deleteAuthStorage, hasProviderAuth, hasAnyAuth, type Provider } from '@core/auth';
import logger from '@core/logger';

interface LogoutArgs {
  provider?: string;
}

export async function logoutCommand(argv: ArgumentsCamelCase<LogoutArgs>) {
  const provider = argv.provider as Provider | undefined;

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

    deleteProviderTokens(provider);
    logger.info(`\nLogged out from ${provider}.`);
    logger.info('Tokens have been removed.\n');
  } else {
    // Logout all providers
    deleteAuthStorage();
    logger.info('\nLogged out from all providers.');
    logger.info('All tokens have been removed.\n');
  }

  process.exit(0);
}
