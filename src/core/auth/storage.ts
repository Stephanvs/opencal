import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from 'fs';
import { dirname } from 'path';
import { getAuthFilePath } from '../config/path';
import type {
  AuthStorage,
  AccountTokens,
  AccountInfo,
  TokenData
} from './types';

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
    const data = JSON.parse(content);

    // Migrate from old format with "accounts" wrapper to new format
    const migrated: AuthStorage = {};
    for (const [provider, providerData] of Object.entries(data)) {
      if (providerData && typeof providerData === 'object' && 'accounts' in providerData) {
        // Old format: { google: { accounts: { accountId: AccountTokens } } }
        migrated[provider] = (providerData as any).accounts;
      } else {
        // New format: { google: { accountId: AccountTokens } }
        migrated[provider] = providerData as Record<string, AccountTokens>;
      }
    }

    // If migration happened, save the new format
    if (JSON.stringify(data) !== JSON.stringify(migrated)) {
      writeAuthStorage(migrated);
    }

    return migrated;
  } catch (error) {
    console.error(`Error reading auth file: ${error}`);
    return {};
  }
}

/**
 * Write authentication data to auth.json
 * Creates directory if it doesn't exist
 * Sets file permissions to 0600 (owner read/write only)
 * Deletes file if no data to store
 *
 * @param data - Complete AuthStorage object to write
 */
export function writeAuthStorage(data: AuthStorage): void {
  const filePath = getAuthFilePath();

  // If no data, delete the file
  if (Object.keys(data).length === 0) {
    deleteAuthStorage();
    return;
  }

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
 * Extract account information from token data
 *
 * @param tokens - Token data to extract info from
 * @param provider - Provider type
 * @returns AccountInfo object
 */
export function extractAccountInfo(tokens: TokenData, provider: string): AccountInfo {
  let email = 'unknown@example.com';
  let name: string | undefined;
  let picture: string | undefined;
  let id: string;

  if (provider === 'google' && tokens.idToken) {
    // Decode the ID token (JWT) to extract user info
    try {
      const parts = tokens.idToken.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        email = payload.email || email;
        name = payload.name;
        picture = payload.picture;
        id = payload.sub || email;
      } else {
        id = email;
      }
    } catch (error) {
      console.warn('Failed to decode ID token:', error);
      id = email;
    }
  } else {
    // Fallback for Microsoft or if no ID token
    id = email;
  }

  return {
    id,
    email,
    name,
    picture,
    provider
  };
}

/**
 * Generate a unique account ID
 *
 * @param accountInfo - Account information
 * @returns Unique account ID
 */
function generateAccountId(accountInfo: AccountInfo): string {
  // Use email as primary identifier, fallback to provider-specific ID
  return accountInfo.email || accountInfo.id;
}

/**
 * Save tokens for a specific account
 *
 * @param provider - Provider name (google, microsoft)
 * @param accountInfo - Account information
 * @param tokens - Token data to save
 */
export function saveAccountTokens(
  provider: string,
  accountInfo: AccountInfo,
  tokens: TokenData
): void {
  const storage = readAuthStorage();
  const accountId = generateAccountId(accountInfo);

  const accountTokens: AccountTokens = {
    type: 'oauth',
    tokens,
    account: accountInfo
  };

  if (!storage[provider]) {
    storage[provider] = {};
  }

  storage[provider][accountId] = accountTokens;

  writeAuthStorage(storage);
}

/**
 * Get tokens for a specific account
 *
 * @param provider - Provider name (google, microsoft)
 * @param accountId - Account ID (email or custom ID)
 * @returns Account tokens, or undefined if not found
 */
export function getAccountTokens(provider: string, accountId: string): AccountTokens | undefined {
  const storage = readAuthStorage();
  return storage[provider]?.[accountId];
}

/**
 * Get all account tokens for a provider
 *
 * @param provider - Provider name (google, microsoft)
 * @returns Array of all account tokens for the provider
 */
export function getAllAccountTokens(provider: string): AccountTokens[] {
  const storage = readAuthStorage();
  const providerData = storage[provider];

  if (!providerData) {
    return [];
  }

  return Object.values(providerData);
}

/**
 * Get all accounts for a provider
 *
 * @param provider - Provider name (google, microsoft)
 * @returns Array of account tokens
 */
export function getAllAccounts(provider: string): AccountTokens[] {
  const storage = readAuthStorage();
  const providerData = storage[provider];

  if (!providerData) {
    return [];
  }

  return Object.values(providerData);
}



/**
 * Remove an account from storage
 *
 * @param provider - Provider name (google, microsoft)
 * @param accountId - Account ID to remove
 * @returns true if successful, false if account not found
 */
export function removeAccount(provider: string, accountId: string): boolean {
  const storage = readAuthStorage();
  const providerData = storage[provider];

  if (!providerData || !providerData[accountId]) {
    return false;
  }

  delete providerData[accountId];

  // If no accounts left, remove the provider entirely
  if (Object.keys(providerData).length === 0) {
    delete storage[provider];
  }

  writeAuthStorage(storage);
  return true;
}



/**
 * Check if any provider is authenticated
 *
 * @returns true if at least one provider has accounts
 */
export function hasAnyAuth(): boolean {
  const storage = readAuthStorage();
  return Object.keys(storage).length > 0;
}

/**
 * Check if a specific provider is authenticated
 *
 * @param provider - Provider name to check
 * @returns true if provider has accounts
 */
export function hasProviderAuth(provider: string): boolean {
  const storage = readAuthStorage();
  const providerData = storage[provider];
  return providerData !== undefined && Object.keys(providerData).length > 0;
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
