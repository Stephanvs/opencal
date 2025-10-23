/**
 * OAuth Flow Implementation
 *
 * Handles OAuth 2.0 authorization code flow with PKCE
 */

import { google } from 'googleapis';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { createServer, type Server } from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { TokenData } from './types';
import { generatePKCE } from "@openauthjs/openauth/pkce";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



/**
 * Result of OAuth flow
 */
export interface OAuthFlowResult {
  success: boolean;
  tokens?: TokenData;
  error?: string;
}

const CLIENT_ID = '725023205531-qi142osnns4o1n503hj0001lt9smf44d.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

/**
 * Start OAuth flow for Google using PKCE with local server
 */
export async function authorize(): Promise<OAuthFlowResult> {
  try {
    const pkce = await generatePKCE();

    // Create OAuth2 client
    const client = new google.auth.OAuth2({
      client_id: CLIENT_ID,
      redirectUri: "http://localhost:3000/auth/google/callback"
    });

    // Generate auth URL with PKCE
    const authUrl = client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: SCOPES,
      prompt: 'consent', // Force consent screen to get refresh token
      code_challenge: pkce.challenge,
      code_challenge_method: CodeChallengeMethod.S256,
      state: pkce.verifier,
    });

    console.log('\nOpening browser for authorization...');
    console.log('If browser doesn\'t open, visit this URL:\n');
    console.log(authUrl);
    console.log('');

    // Try to open browser
    await openBrowser(authUrl);

    // Start local server and wait for callback
    const code = await waitForOAuthCallback();

    const tokens = await exchangeCodeForTokens(client, code, pkce.verifier);

    return {
      success: true,
      tokens,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Start local HTTP server and wait for OAuth callback
 */
function waitForOAuthCallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    let server: Server | null = null;
    const timeout = setTimeout(() => {
      if (server) server.close();
      reject(new Error('OAuth flow timed out after 5 minutes'));
    }, 5 * 60 * 1000); // 5 minute timeout

    server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url!, 'http://localhost:3000');

        if (url.pathname === '/auth/google/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            const html = fs.readFileSync(path.join(__dirname, 'html', 'error-oauth.html'), 'utf8').replace('{{error}}', error);
            res.end(html);
            clearTimeout(timeout);
            if (server) server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            const html = fs.readFileSync(path.join(__dirname, 'html', 'error-no-code.html'), 'utf8');
            res.end(html);
            clearTimeout(timeout);
            if (server) server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          // Success: Show success page and return code
          res.writeHead(200, { 'Content-Type': 'text/html' });
          const html = fs.readFileSync(path.join(__dirname, 'html', 'success.html'), 'utf8');
          res.end(html);

          clearTimeout(timeout);
          if (server) server.close();

          resolve(code);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        const message = error instanceof Error ? error.message : 'Unknown error';
        const html = fs.readFileSync(path.join(__dirname, 'html', 'error-general.html'), 'utf8').replace('{{message}}', message);
        res.end(html);
        clearTimeout(timeout);
        if (server) server.close();
        reject(error);
      }
    });

    server.listen(3000, () => {
      console.log('Waiting for authorization...\n');
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start local server: ${error.message}`));
    });
  });
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(oauth2Client: OAuth2Client, code: string, verifier: string): Promise<TokenData> {
  try {
    const result = await oauth2Client.getToken({
      code,
      codeVerifier: verifier
    });
    const tokens = result.tokens;

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to receive valid tokens');
    }

    const tokenData: TokenData = {
      access: tokens.access_token,
      refresh: tokens.refresh_token,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      expiryTimestamp: tokens.expiry_date || Date.now() + 3600000,
      scopes: tokens.scope?.split(' ') || [],
    };

    return tokenData;
  } catch (error: any) {
    console.error('Token exchange error:', error);
    throw new Error(error?.response?.data?.error_description || error?.message || 'Token exchange failed');
  }
}

/**
 * Try to open URL in default browser
 */
async function openBrowser(url: string): Promise<void> {
  const { platform } = process;
  let command: string;

  switch (platform) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "" "${url}"`;
      break;
    default:
      // Linux and others
      command = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;
      break;
  }

  try {
    const { exec } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    // Fail silently - user can copy URL manually
  }
}
