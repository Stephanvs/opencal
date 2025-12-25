import { createContext, createSignal, onMount, useContext, type ParentProps } from "solid-js"
import { getAllAccounts, saveAccountTokens, extractAccountInfo } from '@core/auth/storage'
import { listAuthProviders } from '@core/auth/providers'
import type { TokenData, AccountInfo } from '@core/auth/types'
import logger from '@core/logger'

function init() {
  const providers = listAuthProviders()
  const provider = providers[0] // For now, use the first provider
  if (!provider) throw new Error('No auth providers available')
  const providerId = provider.id

  type AuthType = 'unauthorized' | typeof providerId

  const [auth, setAuth] = createSignal<{ type: AuthType; token?: TokenData }>({
    type: 'unauthorized'
  })

  async function validateToken(token: TokenData): Promise<boolean> {
    return token.expiryTimestamp > Date.now()
  }

  async function refreshToken(token: TokenData): Promise<TokenData | null> {
    try {
      if (!provider!.refreshTokens) {
        throw new Error('Provider does not support token refresh')
      }
      return await provider!.refreshTokens(provider!.defaultConfig, token);
    } catch (error) {
      logger.error('Failed to refresh token:', error)
      return null
    }
  }

  // Load tokens on startup
  onMount(async () => {
    const accounts = getAllAccounts(providerId)
    logger.info('auth:onMount entry, accounts: ', accounts)
    if (accounts.length > 0) {
      const account = accounts[0] // Use first account for now
      if (account) {
        const isValid = await validateToken(account.tokens)
        if (isValid) {
          logger.info('auth:onMount isValid:', isValid)
          setAuth({ type: providerId, token: account.tokens })
        } else {
          // Try to refresh
          logger.info('refreshing token')
          const refreshed = await refreshToken(account.tokens)
          if (refreshed) {
            setAuth({ type: providerId, token: refreshed })
            saveAccountTokens(providerId, account.account, refreshed)
          }
        }
      }
    }
  })

  return {
    get data() {
      return auth()
    },
    google_login(token: TokenData) {
      logger.info("login", token)
      setAuth({ type: providerId, token })
      const accountInfo = extractAccountInfo(token, providerId)
      saveAccountTokens(providerId, accountInfo, token)
    },
    logout() {
      setAuth({ type: 'unauthorized' })
      // Note: Don't delete tokens here, as logout might be temporary
    },
    async refreshIfNeeded() {
      const currentAuth = auth()
      if (currentAuth.type === providerId && currentAuth.token) {
        if (currentAuth.token.expiryTimestamp < Date.now()) {
          const refreshed = await refreshToken(currentAuth.token)
          if (refreshed) {
            setAuth({ type: providerId, token: refreshed })
            const accounts = getAllAccounts(providerId)
            if (accounts.length > 0 && accounts[0]) {
              saveAccountTokens(providerId, accounts[0].account, refreshed)
            }
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

