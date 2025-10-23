/**
 * Config Path Resolution
 *
 * Resolves the platform-specific path for storing authentication data.
 * Follows XDG Base Directory specification on Linux.
 */

import { join } from 'path';
import { homedir, platform } from 'os';

/**
 * Get the config directory path based on the current platform
 *
 * - Linux: ~/.local/share/opencal or $XDG_DATA_HOME/opencal
 * - macOS: ~/Library/Application Support/opencal
 * - Windows: %APPDATA%\opencal
 */
export function getConfigDir(): string {
  const plat = platform();
  const home = homedir();

  switch (plat) {
    case 'linux':
      // Follow XDG Base Directory specification
      const xdgDataHome = process.env.XDG_DATA_HOME;
      return xdgDataHome
        ? join(xdgDataHome, 'opencal')
        : join(home, '.local', 'share', 'opencal');

    case 'darwin':
      // macOS
      return join(home, 'Library', 'Application Support', 'opencal');

    case 'win32':
      // Windows
      const appData = process.env.APPDATA;
      if (!appData) {
        throw new Error('APPDATA environment variable not set');
      }
      return join(appData, 'opencal');

    default:
      // Fallback for other platforms
      return join(home, '.opencal');
  }
}

/**
 * Get the full path to the auth.json file
 */
export function getAuthFilePath(): string {
  return join(getConfigDir(), 'auth.json');
}
