import { createStore } from "solid-js/store"
import { createContext, useContext, type ParentProps } from "solid-js"

type JwtToken = {
  access_token: string,
  refresh_token: string,
  scopes: string[],
}

export type Auth =
  | { type: 'unauthorized' }
  | { type: 'google', token: JwtToken }

function init() {
  const [authStore, setAuthStore] = createStore<Auth>({
    type: 'unauthorized'
  })

  return {
    get data() {
      return authStore
    },
    google_login(token: JwtToken) {
      console.log("google login", token)
      setAuthStore({ type: 'google', token })
    },
    logout() {
      setAuthStore({ type: 'unauthorized' })
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

