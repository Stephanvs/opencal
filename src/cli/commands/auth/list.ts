/**
 * Auth List Command
 *
 * Lists all authenticated providers and their status.
 */

import { readAuthStorage, getTimeUntilExpiry, formatExpiryDate, isTokenExpired, type Provider } from '../../../core/auth';

export async function listCommand() {
  console.log('\nAuthenticated Providers:\n');

  const storage = readAuthStorage();
  const providers = Object.keys(storage) as Provider[];

  if (providers.length === 0) {
    console.log('No authentication data found.');
    console.log('Run "opencal auth login google" to authenticate.\n');
    process.exit(0);
  }

  for (const provider of providers) {
    const providerTokens = storage[provider];
    if (!providerTokens) continue;

    const expired = isTokenExpired(providerTokens.tokens);
    const timeUntil = getTimeUntilExpiry(providerTokens.tokens);
    const expiryDate = formatExpiryDate(providerTokens.tokens);

    const status = expired ? '[EXPIRED]' : '[Active]';

    console.log(`${provider.toUpperCase()}`);
    console.log(`  Status: ${status}`);
    console.log(`  Expires: ${expiryDate} (${timeUntil})`);
    console.log(`  Scopes: ${providerTokens.tokens.scopes.join(', ')}`);
    console.log('');
  }

  process.exit(0);
}
