/**
 * Token Storage Types
 *
 * Type definitions for authentication token storage.
 * Uses OpenAuth's standard Tokens interface for provider-agnostic token handling.
 */

import type { Tokens } from '@openauthjs/openauth/client';

/**
 * Extended token data with additional metadata
 *
 * OpenAuth's Tokens interface provides:
 * - access: string (access token)
 * - refresh: string (refresh token)
 * - expiresIn: number (seconds until expiry)
 *
 * We extend it with:
 * - expiryTimestamp: absolute timestamp for easier checking
 * - scopes: granted OAuth scopes
 */
export interface TokenData extends Tokens {
  /** Absolute expiry timestamp in milliseconds since epoch */
  expiryTimestamp: number;
  /** OAuth scopes granted */
  scopes: string[];
}

/**
 * Provider-specific token storage
 */
export interface ProviderTokens {
  /** Authentication type (always 'oauth' for now) */
  type: 'oauth';
  /** Token data using OpenAuth's standard format */
  tokens: TokenData;
}

/**
 * Main auth.json structure
 * Supports multiple providers
 */
export interface AuthStorage {
  google?: ProviderTokens;
  microsoft?: ProviderTokens;
}

/**
 * Supported calendar providers
 */
export type Provider = 'google' | 'microsoft';
