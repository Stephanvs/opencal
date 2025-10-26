/**
 * Auth Login Command
 *
 * Handles authentication flow for calendar providers.
 * Currently supports Google Calendar (with Microsoft planned for future).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { authorize } from '@core/auth/oauth-flow';
import { saveProviderTokens } from '@core/auth';
import type { Provider } from '@core/auth';
import logger from '@core/logger';

interface LoginArgs {
  provider: string;
}

export async function loginCommand(argv: ArgumentsCamelCase<LoginArgs>) {
  const provider = argv.provider as Provider;

  logger.info(`\nAuthenticating with ${provider}...\n`);

  if (provider === 'google') {
    await handleGoogleLogin();
  } else if (provider === 'microsoft') {
    logger.info('Microsoft authentication not yet implemented.');
    logger.info('Coming soon!\n');
    process.exit(1);
  } else {
    logger.info(`Unknown provider: ${provider}`);
    logger.info('Supported providers: google, microsoft\n');
    process.exit(1);
  }
}

async function handleGoogleLogin() {
  try {
    const result = await authorize();

    if (!result.success || !result.tokens) {
      logger.info(`\nAuthentication failed: ${result.error}\n`);
      process.exit(1);
    }

    // Save tokens
    saveProviderTokens('google', {
      type: 'oauth',
      tokens: result.tokens,
    });

    logger.info('\nAuthentication successful!');
    logger.info('Tokens have been saved.\n');
    logger.info('You can now use OpenCal to access your Google Calendar.');
    logger.info('Run "opencal auth list" to see your authentication status.\n');

    process.exit(0);
  } catch (error) {
    logger.info(`\nAuthentication error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}
