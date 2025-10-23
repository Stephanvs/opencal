/**
 * Auth Login Command
 *
 * Handles authentication flow for calendar providers.
 * Currently supports Google Calendar (with Microsoft planned for future).
 */

import type { ArgumentsCamelCase } from 'yargs';
import { authorize } from '../../../core/auth/oauth-flow';
import { saveProviderTokens } from '../../../core/auth';
import type { Provider } from '../../../core/auth';

interface LoginArgs {
  provider: string;
}

export async function loginCommand(argv: ArgumentsCamelCase<LoginArgs>) {
  const provider = argv.provider as Provider;

  console.log(`\nAuthenticating with ${provider}...\n`);

  if (provider === 'google') {
    await handleGoogleLogin();
  } else if (provider === 'microsoft') {
    console.log('Microsoft authentication not yet implemented.');
    console.log('Coming soon!\n');
    process.exit(1);
  } else {
    console.log(`Unknown provider: ${provider}`);
    console.log('Supported providers: google, microsoft\n');
    process.exit(1);
  }
}

async function handleGoogleLogin() {
  try {
    const result = await authorize();

    if (!result.success || !result.tokens) {
      console.log(`\nAuthentication failed: ${result.error}\n`);
      process.exit(1);
    }

    // Save tokens
    saveProviderTokens('google', {
      type: 'oauth',
      tokens: result.tokens,
    });

    console.log('\nAuthentication successful!');
    console.log('Tokens have been saved.\n');
    console.log('You can now use OpenCal to access your Google Calendar.');
    console.log('Run "opencal auth list" to see your authentication status.\n');

    process.exit(0);
  } catch (error) {
    console.log(`\nAuthentication error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}
