/**
 * OAuth Configuration
 *
 * Configuration for OAuth providers (Google, Microsoft, etc.)
 * Uses PKCE flow - NO CLIENT SECRET REQUIRED (safe for public clients)
 */

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}
