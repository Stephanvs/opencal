import { TextAttributes } from "@opentui/core";
import { render, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { createEffect, Match, Switch } from "solid-js";
import { openBrowser, waitForOAuthCallback } from "@core/auth/oauth-flow";
import { list } from "@core/auth/providers";
import { AuthProviders } from "@core/auth/providers/context";
import logger from "@core/logger";
import { AuthProvider, NotAuthenticated, useAuth } from "./auth";
import { DialogProvider, useDialog } from "./dialog/dialog";
import { CommandProvider, useCommandDialog } from "./dialog/dialog-command";
import { KeybindProvider } from "./keyboard/keybind-context";
import { RouteProvider, useRoute } from "./context/route";
import { ThemeProvider, useTheme } from "./context/theme";
import { Home } from "./home";
import { Toast, ToastProvider, useToast } from "./toast";
import "opentui-spinner/solid";

render(
  () => (
    <AuthProviders>
      <ThemeProvider mode="dark">
        <AuthProvider>
          <RouteProvider>
            <KeybindProvider>
              <ToastProvider>
                <DialogProvider>
                  <CommandProvider>
                    <App />
                  </CommandProvider>
                </DialogProvider>
              </ToastProvider>
            </KeybindProvider>
          </RouteProvider>
        </AuthProvider>
      </ThemeProvider>
    </AuthProviders>
  ),
  {
    targetFps: 60,
    gatherStats: false,
    useKittyKeyboard: {},
    consoleOptions: {
      titleBarColor: "#cc33ff",
    },
  },
);

function App() {
  const auth = useAuth();
  const route = useRoute();
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer();
  const dialog = useDialog();
  const command = useCommandDialog();
  const toast = useToast();
  const { theme, all, selected, mode, set, toggleMode } = useTheme();

  createEffect(() => {
    logger.info(JSON.stringify(route.data));
  });

  command.register(() => [
    {
      title: "Add Google Account",
      value: "auth_google_login",
      category: "Accounts",
      suggested: true,
      onSelect: async () => {
        dialog.replace(() => (
          <box
            flexDirection="row"
            paddingLeft={3}
            paddingRight={3}
            paddingTop={1}
            paddingBottom={1}
          >
            <spinner name="dots" color={theme.primary} />
            <text marginLeft={1}>Waiting for browser...</text>
          </box>
        ));

        try {
          const providers = list();
          const provider = providers.find((p) => p.id === "google");
          if (!provider) {
            throw new Error("Google provider not found");
          }

          const result = await provider.authorize(provider.defaultConfig, {
            openBrowser,
            waitForOAuthCallback,
            logger,
          });

          if (result.success && result.tokens) {
            auth.login(result.tokens, "google");
            dialog.clear();
            toast.success("Successfully authenticated with Google!");
          } else {
            logger.error("OAuth failed:", result.error);
            dialog.clear();
            toast.error(
              new Error(result.error ?? "OAuth authentication failed"),
            );
          }
        } catch (error) {
          logger.error("OAuth error:", error);
          dialog.clear();
          toast.error(error);
        }
      },
    },
  ]);

  if (auth.data.type !== "unauthorized") {
    command.register(() => [
      {
        title: "Logout",
        value: "auth_logout",
        category: "Accounts",
        onSelect: () => {
          auth.logout();
          dialog.clear();
          toast.info("You have been logged out");
        },
      },
    ]);
  }

  command.register(() => [
    {
      title: "Quit",
      description: "Exit the application",
      value: "app_quit",
      category: "System",
      onSelect: () => {
        process.exit(0);
      },
    },
    {
      title: "Toggle debug panel",
      value: "app_debug",
      category: "System",
      onSelect: () => {
        renderer.toggleDebugOverlay();
        dialog.clear();
      },
    },
    {
      title: "Toggle console",
      value: "app_console",
      category: "System",
      onSelect: () => {
        renderer.console.toggle();
        dialog.clear();
      },
    },
  ]);

  command.register(() => [
    ...all().map((themeName) => ({
      title: `Theme: ${themeName}${selected === themeName ? " (active)" : ""}`,
      value: `theme_${themeName}`,
      category: "Appearance",
      onSelect: () => {
        set(themeName);
        dialog.clear();
      },
    })),
    {
      title: `Toggle dark/light mode (${mode})`,
      value: "theme_toggle_mode",
      category: "Appearance",
      onSelect: () => {
        toggleMode();
        dialog.clear();
      },
    },
  ]);

  return (
    <box
      width={dimensions().width}
      backgroundColor={theme.background}
      flexGrow={1}
    >
      <box flexDirection="column" flexGrow={1}>
        <Switch>
          <Match when={auth.data.type === "unauthorized"}>
            <NotAuthenticated />
          </Match>
          <Match when={route.data.type === "home"}>
            <Home />
          </Match>
        </Switch>
      </box>

      {/* status bar */}
      <box
        height={1}
        backgroundColor={theme.backgroundPanel}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row">
          <box
            flexDirection="row"
            backgroundColor={theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={theme.textMuted}>open</text>
            <text attributes={TextAttributes.BOLD}>cal</text>
          </box>
        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={theme.textMuted}>
            ctrl+p
          </text>
        </box>
      </box>

      <Toast />
    </box>
  );
}
