#!/usr/bin/env bun

/**
 * OpenCal - Main Entry Point
 *
 * Routes to either:
 * - CLI commands (if arguments provided)
 * - TUI (if no arguments)
 */

const args = Bun.argv.slice(2);

if (args.length > 0) {
  // User provided arguments - route to CLI
  await import('./cli/index.ts');
} else {
  // No arguments - launch TUI
  await import('./tui/index.tsx');
}
