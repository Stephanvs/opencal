export function extractAccountInfo(tokens: import('./types').TokenData, provider: string): import('./types').AccountInfo {
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
