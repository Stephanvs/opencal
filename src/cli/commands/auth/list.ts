/**
 * Auth List Command
 *
 * Lists all authenticated providers and their status.
 */

export async function listCommand() {
  console.log('\n📋 Authenticated Providers:\n');

  // TODO: Read from ~/.local/share/opencal/auth.json (Issue #2)
  console.log('⚠️  No authentication data found.');
  console.log('   Run "opencal auth login google" to authenticate.\n');

  process.exit(0);
}
