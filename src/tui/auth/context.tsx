import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type ParentProps,
} from "solid-js";
import { Auth } from "@core/auth";
import { list } from "@core/auth/providers";
import logger from "@core/logger";

function init() {
  const providers = list();
  const provider = providers[0]; // For now, use the first provider

  if (!provider) throw new Error("No auth providers available");
  const providerId = provider.id;

  type AuthState = "unauthorized" | typeof providerId;

  const [auth, setAuth] = createSignal<{ type: AuthState; token?: Auth.Info }>({
    type: "unauthorized",
  });

  // Load tokens on startup
  onMount(async () => {
    const accounts = await Auth.all();
    logger.info("auth:onMount entry, accounts: ", accounts);
    if (Object.keys(accounts).length > 0) {
      const account = accounts[0]; // Use first account for now
      if (Auth.isExpired(account.expires)) {
        const isValid = await validateToken(account);
        if (isValid) {
          logger.info("auth:onMount isValid:", isValid);
          setAuth({ type: providerId, token: account.tokens });
        } else {
          // Try to refresh
          logger.info("refreshing token");
          const refreshed = await refreshToken(account.tokens);
          if (refreshed) {
            setAuth({ type: providerId, token: refreshed });
            saveAccount(account.account, refreshed);
          }
        }
      }
    }
  });

  return {
    get data() {
      return auth();
    },
    login(token: Auth.Info, providerId: string) {
      logger.info("login", token);
      setAuth({ type: providerId, token });
      const account = extractAccountFromTokens(token, providerId);
      saveAccount(account, token);
    },
    logout() {
      setAuth({ type: "unauthorized" });
      const accounts = getAccountsByProvider(providerId);
      if (accounts.length > 0 && accounts[0]) {
        removeAccount(providerId, accounts[0].account.email);
      }
      logger.info("Logged out and deleted stored tokens");
    },
    async refreshIfNeeded() {
      const currentAuth = auth();
      if (currentAuth.type === providerId && currentAuth.token) {
        if (currentAuth.token.expiryTimestamp < Date.now()) {
          const refreshed = await refreshToken(currentAuth.token);
          if (refreshed) {
            setAuth({ type: providerId, token: refreshed });
            const accounts = getAccountsByProvider(providerId);
            if (accounts.length > 0 && accounts[0]) {
              saveAccount(accounts[0].account, refreshed);
            }
          } else {
            setAuth({ type: "unauthorized" });
          }
        }
      }
    },
  };
}

export type AuthContext = ReturnType<typeof init>;

const ctx = createContext<AuthContext>();

export function AuthProvider(props: ParentProps) {
  const value = init();
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>;
}

export function useAuth() {
  const value = useContext(ctx);
  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return value;
}
