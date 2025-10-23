/**
 * Token Validation Utilities
 *
 * Helper functions for validating and checking token status.
 */

import type { TokenData, ProviderTokens } from './types';

/**
 * Check if a token is expired
 *
 * @param tokenData - Token data to check
 * @returns true if token is expired
 */
export function isTokenExpired(tokenData: TokenData): boolean {
  return tokenData.expiryTimestamp < Date.now();
}

/**
 * Check if a token is about to expire (within 5 minutes)
 *
 * @param tokenData - Token data to check
 * @returns true if token expires within 5 minutes
 */
export function isTokenExpiringSoon(tokenData: TokenData): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return tokenData.expiryTimestamp < Date.now() + fiveMinutes;
}

/**
 * Get time until token expires in a human-readable format
 *
 * @param tokenData - Token data to check
 * @returns Human-readable string like "2 hours" or "expired"
 */
export function getTimeUntilExpiry(tokenData: TokenData): string {
  const now = Date.now();
  const diff = tokenData.expiryTimestamp - now;

  if (diff <= 0) {
    return 'expired';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

/**
 * Validate that ProviderTokens has all required fields
 *
 * @param providerTokens - Tokens to validate
 * @returns true if valid, false otherwise
 */
export function isValidProviderTokens(providerTokens: any): providerTokens is ProviderTokens {
  if (!providerTokens || typeof providerTokens !== 'object') {
    return false;
  }

  if (providerTokens.type !== 'oauth') {
    return false;
  }

  const tokens = providerTokens.tokens;
  if (!tokens || typeof tokens !== 'object') {
    return false;
  }

  return (
    typeof tokens.access === 'string' &&
    typeof tokens.refresh === 'string' &&
    typeof tokens.expiresIn === 'number' &&
    typeof tokens.expiryTimestamp === 'number' &&
    Array.isArray(tokens.scopes) &&
    tokens.scopes.every((s: any) => typeof s === 'string')
  );
}

/**
 * Format token expiry date
 *
 * @param tokenData - Token data
 * @returns Formatted date string
 */
export function formatExpiryDate(tokenData: TokenData): string {
  const date = new Date(tokenData.expiryTimestamp);
  return date.toLocaleString();
}
