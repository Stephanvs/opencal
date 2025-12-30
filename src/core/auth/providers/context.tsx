import { type ParentProps, createContext, useContext } from "solid-js";
import "./google";

const ctx = createContext<boolean>(false);

export function AuthProviders(props: ParentProps) {
  return <ctx.Provider value={true}>{props.children}</ctx.Provider>;
}

export function useAuthProviders() {
  const value = useContext(ctx);
  if (!value) {
    throw new Error("useAuthProviders must be used within AuthProviders");
  }
  return value;
}
