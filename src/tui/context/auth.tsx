import { createSignal } from "solid-js"
import { createContext, useContext, type ParentProps, onMount } from "solid-js"
import { createGoogleClient, getProviderTokens, saveProviderTokens } from '@core/auth'
import type { TokenData } from '@core/auth/types'
import logger from '@core/logger'

export type Auth =
  | { type: 'unauthorized' }
  | { type: 'google', token: TokenData }

async function validateToken(token: TokenData): Promise<boolean> {
  return token.expiryTimestamp > Date.now()
}

async function refreshToken(token: TokenData): Promise<TokenData | null> {
  try {
    const oauthClient = createGoogleClient();
    oauthClient.setCredentials({
      access_token: token.access,
      refresh_token: token.refresh,
    })

    const { credentials } = await oauthClient.refreshAccessToken()
    const refreshed: TokenData = {
      access: credentials.access_token!,
      refresh: credentials.refresh_token || token.refresh,
      expiresIn: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      expiryTimestamp: credentials.expiry_date || Date.now() + 3600000,
      scopes: token.scopes,
    }
    return refreshed
  } catch (error) {
    logger.error('Failed to refresh token:', error)
    return null
  }
}

function init() {
  const [auth, setAuth] = createSignal<Auth>({
    type: 'unauthorized'
  })

  // Load tokens on startup
  onMount(async () => {
    const tokens = getProviderTokens('google')
    logger.info('auth:onMount entry, tokens: ', tokens)
    if (tokens?.tokens) {
      const isValid = await validateToken(tokens.tokens)
      if (isValid) {
        logger.info('auth:onMount isValid:', isValid)
        setAuth({ type: 'google', token: tokens.tokens })
      } else {
        // Try to refresh
        logger.info('refreshing token')
        const refreshed = await refreshToken(tokens.tokens)
        if (refreshed) {
          setAuth({ type: 'google', token: refreshed })
          saveProviderTokens('google', { type: 'oauth', tokens: refreshed })
        }
      }
    }
  })

  return {
    get data() {
      return auth()
    },
    google_login(token: TokenData) {
      logger.info("google login", token)
      setAuth({ type: 'google', token })
      saveProviderTokens('google', { type: 'oauth', tokens: token })
    },
    logout() {
      setAuth({ type: 'unauthorized' })
      // Note: Don't delete tokens here, as logout might be temporary
    },
    async refreshIfNeeded() {
      const currentAuth = auth()
      if (currentAuth.type === 'google') {
        if (currentAuth.token.expiryTimestamp < Date.now()) {
          const refreshed = await refreshToken(currentAuth.token)
          if (refreshed) {
            setAuth({ type: 'google', token: refreshed })
            saveProviderTokens('google', { type: 'oauth', tokens: refreshed })
          } else {
            setAuth({ type: 'unauthorized' })
          }
        }
      }
    },
  }
}

export type AuthContext = ReturnType<typeof init>

const ctx = createContext<AuthContext>()

export function AuthProvider(props: ParentProps) {
  const value = init()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useAuth() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useAuth must be used within a AuthProvider")
  }
  return value
}

