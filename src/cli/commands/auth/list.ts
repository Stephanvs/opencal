/**
 * Auth List Command
 *
 * Lists all authenticated providers and their status.
 */

import { getAllAccounts } from '@core/auth/storage';
import { getTimeUntilExpiry, formatExpiryDate, isTokenExpired } from '@core/auth/validation';
import { listAuthProviders } from '@core/auth/providers';
import logger from '@core/logger';

export async function listCommand() {
  logger.info('Authenticated Accounts:');

  const providers = listAuthProviders();
  let hasAnyAccounts = false;

  for (const provider of providers) {
    const accounts = getAllAccounts(provider.id);

    if (accounts.length === 0) continue;

    hasAnyAccounts = true;
    logger.info(`${provider.label.toUpperCase()}:`);

    for (const account of accounts) {
      const expired = isTokenExpired(account.tokens);
      const timeUntil = getTimeUntilExpiry(account.tokens);
      const expiryDate = formatExpiryDate(account.tokens);

      const status = expired ? '[EXPIRED]' : '[Active]';

      logger.info(`  ${account.account.email}`);
      logger.info(`    Status: ${status}`);
      logger.info(`    Expires: ${expiryDate} (${timeUntil})`);
      logger.info(`    Scopes: ${account.tokens.scopes.join(', ')}`);
      logger.info('');
    }
  }

  if (!hasAnyAccounts) {
    logger.info('No authentication data found.');
    logger.info(`Run "opencal auth login ${providers[0]?.id || 'provider'}" to authenticate.\n`);
    process.exit(0);
  }

  process.exit(0);
}
