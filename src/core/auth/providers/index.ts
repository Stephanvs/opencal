import type { Auth } from "@core/account";

export interface AuthProviderConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  // place for provider-specific options if you need them later
  [key: string]: unknown;
}

export interface AuthProviderContext {
  // shared tools so providers don't import impl details ad-hoc
  openBrowser: (url: string) => Promise<void>;
  waitForOAuthCallback: <T>(
    handler: (req: any, res: any) => T | Promise<T>,
  ) => Promise<T>;
  logger: {
    info: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export interface AuthProvider {
  id: Auth.ProviderId;
  label: string; // for CLI display
  // Default scopes if user doesn't override
  defaultScopes: string[];
  // Default config for the provider
  defaultConfig: AuthProviderConfig;

  // Generate auth URL, possibly using openauth
  getAuthorizationUrl(
    config: AuthProviderConfig,
    opts: {
      state: string;
      codeChallenge?: string;
    },
  ): Promise<string>;

  exchangeCodeForTokens(
    config: AuthProviderConfig,
    input: {
      code: string;
      codeVerifier?: string;
    },
  ): Promise<Auth.Info>;

  // Refresh tokens if supported
  refreshTokens?(
    config: AuthProviderConfig,
    tokens: Auth.Info,
  ): Promise<Auth.Info>;

  // High-level flow used by CLI (wrapper that uses above plus shared oauth-flow)
  authorize(
    config: AuthProviderConfig,
    ctx: AuthProviderContext,
  ): Promise<{
    success: boolean;
    tokens?: Auth.Info;
    error?: string;
  }>;
}

const registry = new Map<Auth.ProviderId, AuthProvider>();

export function register(provider: AuthProvider) {
  if (registry.has(provider.id)) {
    throw new Error(`Auth provider '${provider.id}' already registered`);
  }
  registry.set(provider.id, provider);
}

export function get(id: Auth.ProviderId): AuthProvider | undefined {
  return registry.get(id);
}

export function list(): AuthProvider[] {
  return Array.from(registry.values());
}
