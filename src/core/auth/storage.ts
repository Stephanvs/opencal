/**
 * Authentication Token Storage
 *
 * Handles reading, writing, and deleting OAuth tokens from auth.json.
 * Ensures proper file permissions for security (0600 on Unix).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from 'fs';
import { dirname } from 'path';
import { getAuthFilePath } from '../config/path';
import type { AuthStorage, Provider, ProviderTokens } from './types';

/**
 * Read all authentication data from auth.json
 *
 * @returns AuthStorage object, or empty object if file doesn't exist
 */
export function readAuthStorage(): AuthStorage {
  const filePath = getAuthFilePath();

  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as AuthStorage;
  } catch (error) {
    console.error(`Error reading auth file: ${error}`);
    return {};
  }
}

/**
 * Write authentication data to auth.json
 * Creates directory if it doesn't exist
 * Sets file permissions to 0600 (owner read/write only)
 *
 * @param data - Complete AuthStorage object to write
 */
export function writeAuthStorage(data: AuthStorage): void {
  const filePath = getAuthFilePath();
  const dir = dirname(filePath);

  // Create directory if it doesn't exist
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  // Write file
  const content = JSON.stringify(data, null, 2);
  writeFileSync(filePath, content, { encoding: 'utf-8', mode: 0o600 });

  // Ensure permissions are correct (some systems don't respect mode in writeFileSync)
  try {
    chmodSync(filePath, 0o600);
  } catch (error) {
    // chmod may not be available on Windows, ignore
  }
}

/**
 * Save tokens for a specific provider
 *
 * @param provider - Provider name (google, microsoft)
 * @param tokens - Provider token data to save
 */
export function saveProviderTokens(provider: Provider, tokens: ProviderTokens): void {
  const storage = readAuthStorage();
  storage[provider] = tokens;
  writeAuthStorage(storage);
}

/**
 * Get tokens for a specific provider
 *
 * @param provider - Provider name (google, microsoft)
 * @returns Provider tokens, or undefined if not found
 */
export function getProviderTokens(provider: Provider): ProviderTokens | undefined {
  const storage = readAuthStorage();
  return storage[provider];
}

/**
 * Delete tokens for a specific provider
 *
 * @param provider - Provider name (google, microsoft)
 */
export function deleteProviderTokens(provider: Provider): void {
  const storage = readAuthStorage();
  delete storage[provider];

  // If no providers left, delete the entire file
  if (Object.keys(storage).length === 0) {
    deleteAuthStorage();
  } else {
    writeAuthStorage(storage);
  }
}

/**
 * Delete the entire auth.json file
 */
export function deleteAuthStorage(): void {
  const filePath = getAuthFilePath();

  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch (error) {
      console.error(`Error deleting auth file: ${error}`);
    }
  }
}

/**
 * Check if any provider is authenticated
 *
 * @returns true if at least one provider has tokens
 */
export function hasAnyAuth(): boolean {
  const storage = readAuthStorage();
  return Object.keys(storage).length > 0;
}

/**
 * Check if a specific provider is authenticated
 *
 * @param provider - Provider name to check
 * @returns true if provider has tokens
 */
export function hasProviderAuth(provider: Provider): boolean {
  const storage = readAuthStorage();
  return provider in storage;
}
