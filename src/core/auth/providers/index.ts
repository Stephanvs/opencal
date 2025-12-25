import type { TokenData } from '../types';

export interface AuthProviderConfig {
  clientId: string;
  clientSecret?: string; // if needed for some flows
  redirectUri: string;
  scopes: string[];
  // place for provider-specific options if you need them later
  [key: string]: unknown;
}

export type AuthProviderId = string

export interface AuthProviderContext {
  // shared tools so providers don't import impl details ad-hoc
  openBrowser: (url: string) => Promise<void>;
  waitForOAuthCallback: <T>(handler: (req: any, res: any) => T | Promise<T>) => Promise<T>;
  logger: {
    info: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export interface AuthProvider {
  id: AuthProviderId;
  label: string; // for CLI display
  // Default scopes if user doesn't override
  defaultScopes: string[];
  // Default config for the provider
  defaultConfig: AuthProviderConfig;

  // Generate auth URL, possibly using openauth
  getAuthorizationUrl(config: AuthProviderConfig, opts: {
    state: string;
    codeChallenge?: string;
  }): Promise<string>;

  // Handle callback -> TokenData using openauth
  exchangeCodeForTokens(config: AuthProviderConfig, input: {
    code: string;
    codeVerifier?: string;
  }): Promise<TokenData>;

  // Refresh tokens if supported
  refreshTokens?(config: AuthProviderConfig, tokens: TokenData): Promise<TokenData>;

  // High-level flow used by CLI (wrapper that uses above plus shared oauth-flow)
  authorize(config: AuthProviderConfig, ctx: AuthProviderContext): Promise<{
    success: boolean;
    tokens?: TokenData;
    error?: string;
  }>;
}

// Registry
const registry = new Map<AuthProviderId, AuthProvider>();

export function registerAuthProvider(provider: AuthProvider) {
  if (registry.has(provider.id)) {
    throw new Error(`Auth provider '${provider.id}' already registered`);
  }
  registry.set(provider.id, provider);
}

// For CLI / app usage
export function getAuthProvider(id: AuthProviderId): AuthProvider | undefined {
  return registry.get(id);
}

export function listAuthProviders(): AuthProvider[] {
  return Array.from(registry.values());
}
