import type { Tokens } from '@openauthjs/openauth/client';

/**
 * Extended token data with additional metadata
 */
export interface TokenData extends Tokens {
  /** Absolute expiry timestamp in milliseconds since epoch */
  expiryTimestamp: number;
  /** OAuth scopes granted */
  scopes: string[];
  /** ID token for user info (if available) */
  idToken?: string;
}

/**
 * Account information extracted from OAuth tokens
 */
export interface AccountInfo {
  /** Provider-specific unique account ID */
  id: string;
  /** Account email address */
  email: string;
  /** Display name (optional) */
  name?: string;
  /** Profile picture URL (optional) */
  picture?: string;
  /** Provider type */
  provider: string;
}

/**
 * Account-specific token storage
 */
export interface AccountTokens {
  /** Authentication type (always 'oauth' for now) */
  type: 'oauth';
  /** Token data using OpenAuth's standard format */
  tokens: TokenData;
  /** Account metadata */
  account: AccountInfo;
}

/**
 * Auth storage structure supporting multiple accounts
 * Maps provider -> accountId -> account tokens
 */
export interface AuthStorage {
  [provider: string]: Record<string, AccountTokens>;
}
