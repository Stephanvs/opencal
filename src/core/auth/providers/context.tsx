import { createContext, createSignal, onMount, useContext, type ParentProps } from "solid-js"
import "./google" // Register Google provider

function initAuthProviders() {
  const [ready, setReady] = createSignal(false)

  onMount(() => {
    // Providers are registered via imports above
    setReady(true)
  })

  return {
    ready,
  }
}

export type AuthProvidersContext = ReturnType<typeof initAuthProviders>

const ctx = createContext<AuthProvidersContext>()

export function AuthProviders(props: ParentProps) {
  const value = initAuthProviders()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useAuthProviders() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useAuthProviders must be used within AuthProviders")
  }
  return value
}

// For CLI usage (non-Solid)
export async function ensureAuthProvidersLoaded() {
  // Providers are registered via imports at module level
}