/**
 * Auth Login Command
 *
 * Handles authentication flow for calendar providers.
 * Currently supports Google Calendar (with Microsoft planned for future).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { openBrowser, waitForOAuthCallback } from '@core/auth/oauth-flow';
import { saveAccountTokens, extractAccountInfo } from '@core/auth/storage';
import { getAuthProvider, listAuthProviders } from '@core/auth/providers';
import { ensureAuthProvidersLoaded } from '@core/auth/providers/context';
import logger from '@core/logger';

interface LoginArgs {
  provider: string;
}

export async function loginCommand(argv: ArgumentsCamelCase<LoginArgs>) {
  await ensureAuthProvidersLoaded();

  const providerId = argv.provider;

  logger.info(`Authenticating with ${providerId}...`);

  const provider = getAuthProvider(providerId);
  if (!provider) {
    const providers = listAuthProviders();
    logger.info(`Unknown provider: ${providerId}`);
    logger.info(`Supported providers: ${providers.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  try {
    const config = provider.defaultConfig;

    const ctx = {
      openBrowser,
      waitForOAuthCallback,
      logger,
    };

    const result = await provider.authorize(config, ctx);

    if (!result.success || !result.tokens) {
      logger.info(`Authentication failed: ${result.error}`);
      process.exit(1);
    }

    // Extract account info and save tokens
    const accountInfo = extractAccountInfo(result.tokens, providerId);
    saveAccountTokens(providerId, accountInfo, result.tokens);

    logger.info('Authentication successful!');
    logger.info('Tokens have been saved.');
    logger.info(`You can now use OpenCal to access your ${provider.label} Calendar.`);
    logger.info('Run "opencal auth list" to see your authentication status.');

    process.exit(0);
  } catch (error) {
    logger.info(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
