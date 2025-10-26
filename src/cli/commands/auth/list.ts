/**
 * Auth List Command
 *
 * Lists all authenticated providers and their status.
 */

import { readAuthStorage, getTimeUntilExpiry, formatExpiryDate, isTokenExpired, type Provider } from '@core/auth';
import logger from '@core/logger';

export async function listCommand() {
  logger.info('\nAuthenticated Providers:\n');

  const storage = readAuthStorage();
  const providers = Object.keys(storage) as Provider[];

  if (providers.length === 0) {
    logger.info('No authentication data found.');
    logger.info('Run "opencal auth login google" to authenticate.\n');
    process.exit(0);
  }

  for (const provider of providers) {
    const providerTokens = storage[provider];
    if (!providerTokens) continue;

    const expired = isTokenExpired(providerTokens.tokens);
    const timeUntil = getTimeUntilExpiry(providerTokens.tokens);
    const expiryDate = formatExpiryDate(providerTokens.tokens);

    const status = expired ? '[EXPIRED]' : '[Active]';

    logger.info(`${provider.toUpperCase()}`);
    logger.info(`  Status: ${status}`);
    logger.info(`  Expires: ${expiryDate} (${timeUntil})`);
    logger.info(`  Scopes: ${providerTokens.tokens.scopes.join(', ')}`);
    logger.info('');
  }

  process.exit(0);
}
