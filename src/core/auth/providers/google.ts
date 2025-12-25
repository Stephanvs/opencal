import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { generatePKCE } from '@openauthjs/openauth/pkce';
import type { TokenData } from '../types';
import { registerAuthProvider, type AuthProvider, type AuthProviderConfig } from './index';

export const CLIENT_ID = '725023205531-qi142osnns4o1n503hj0001lt9smf44d.apps.googleusercontent.com';
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'profile',
  'email',
];

export function createGoogleClient(config: AuthProviderConfig) {
  return new google.auth.OAuth2({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    transporterOptions: {
      fetchImplementation: fetch,
    },
  });
}

function mapTokens(tokens: any): TokenData {
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to receive valid tokens');
  }

  return {
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expiresIn: tokens.expiry_date
      ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
      : 3600,
    expiryTimestamp: tokens.expiry_date || Date.now() + 3600000,
    scopes: tokens.scope?.split(' ') || [],
    ...(tokens.id_token && { idToken: tokens.id_token }),
  };
}

const googleProvider: AuthProvider = {
  id: 'google',
  label: 'Google',
  defaultScopes: DEFAULT_SCOPES,
  defaultConfig: {
    clientId: CLIENT_ID,
    redirectUri: 'http://localhost:3000/auth/google/callback',
    scopes: DEFAULT_SCOPES,
  },

  async getAuthorizationUrl(config, { state, codeChallenge }) {
    const client = createGoogleClient(config);
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: config.scopes?.length ? config.scopes : DEFAULT_SCOPES,
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      state,
    });
  },

  async exchangeCodeForTokens(config, { code, codeVerifier }) {
    const client = createGoogleClient(config);
    const { tokens } = await client.getToken({
      code,
      codeVerifier,
    });
    return mapTokens(tokens);
  },

  async refreshTokens(config, tokens) {
    try {
      const client = createGoogleClient(config);
      client.setCredentials({
        access_token: tokens.access,
        refresh_token: tokens.refresh,
      });
      const { credentials } = await client.refreshAccessToken();
      
      // Merge new credentials with existing tokens, preserving refresh token if not returned
      return {
        ...tokens,
        access: credentials.access_token!,
        refresh: credentials.refresh_token || tokens.refresh,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
        expiryTimestamp: credentials.expiry_date || Date.now() + 3600000,
      };
    } catch (error) {
      // Don't log here, let caller handle
      throw error;
    }
  },

  async authorize(config, ctx) {
    try {
      const { challenge, verifier } = await generatePKCE();

      const authUrl = await this.getAuthorizationUrl(config, {
        state: verifier,
        codeChallenge: challenge,
      });

      ctx.logger.info('\nOpening browser for Google authorization...');
      ctx.logger.info('If browser does not open, visit:\n');
      ctx.logger.info(authUrl);
      ctx.logger.info('');

      await ctx.openBrowser(authUrl);

      const code = await ctx.waitForOAuthCallback((req, res) => {
        const url = new URL(req.url!, config.redirectUri);

        if (url.pathname === '/auth/google/callback') {
          const returnedCode = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            if (!res.headersSent) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
            const html = fs.readFileSync(path.join(__dirname, '..', 'html', 'error-oauth.html'), 'utf8')
              .replace('{{error}}', error);
              res.end(html);
            }
            throw new Error(`OAuth error: ${error}`);
          }

          if (!returnedCode) {
            if (!res.headersSent) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              const html = fs.readFileSync(path.join(__dirname, '..', 'html', 'error-no-code.html'), 'utf8');
              res.end(html);
            }
            throw new Error('No authorization code received');
          }

          if (!res.headersSent) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            const html = fs.readFileSync(path.join(__dirname, '..', 'html', 'success.html'), 'utf8');
            res.end(html);
          }

          return returnedCode;
        } else {
          if (!res.headersSent) {
            res.writeHead(404);
            res.end('Not found');
          }
          throw new Error('Not found');
        }
      });

      const tokens = await this.exchangeCodeForTokens(config, {
        code,
        codeVerifier: verifier,
      });

      return { success: true, tokens };
    } catch (error: any) {
      ctx.logger.error('Google auth error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred',
      };
    }
  }
};

// Auto-register on import
registerAuthProvider(googleProvider);

export default googleProvider;

export function createApiClient(tokens: TokenData, config: AuthProviderConfig) {
  const client = createGoogleClient(config);
  client.setCredentials({
    access_token: tokens.access,
    refresh_token: tokens.refresh,
  });
  return google.calendar({ version: 'v3', auth: client });
}

// Legacy export for backward compatibility
export function createCalendarClient(token: TokenData) {
  return createApiClient(token, {
    clientId: CLIENT_ID,
    redirectUri: "http://localhost:3000/auth/google/callback",
    scopes: DEFAULT_SCOPES,
  });
}

