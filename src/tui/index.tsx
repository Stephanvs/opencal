import { createEffect, Match, Switch } from "solid-js";

import { TextAttributes } from "@opentui/core";
import { render, useRenderer, useTerminalDimensions } from "@opentui/solid";

import { logger } from "@core/logger";
import { Registry } from "@core/provider";
import { googleFactory } from "@core/provider/google";

import { NotAuthenticated } from "./auth";
import { RouteProvider, useRoute } from "./context/route";
import { ThemeProvider, useTheme } from "./context/theme";
import { DialogProvider, useDialog } from "./dialog/dialog";
import { CommandProvider, useCommandDialog } from "./dialog/dialog-command";
import { Home } from "./home";
import { KeybindProvider } from "./keyboard/keybind-context";
import { ProviderProvider, useProvider } from "./provider";
import { Toast, ToastProvider, useToast } from "./toast";

import "opentui-spinner/solid";

// Register providers
Registry.register(googleFactory);

render(
  () => (
    <ThemeProvider mode="dark">
      <ProviderProvider>
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
      </ProviderProvider>
    </ThemeProvider>
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
  const provider = useProvider();
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

  // Register "Add {Provider} Account" commands for each factory
  command.register(() =>
    Registry.list().map((factory) => ({
      title: `Add ${factory.name} Account`,
      value: `add_provider_${factory.name.toLowerCase()}`,
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
          const success = await provider.addProvider(factory.name);
          dialog.clear();

          if (success) {
            toast.success(`Successfully added ${factory.name} account!`);
          } else {
            toast.error(new Error(`Failed to add ${factory.name} account`));
          }
        } catch (error) {
          logger.error("Provider add error:", error);
          dialog.clear();
          toast.error(error);
        }
      },
    })),
  );

  // Register logout commands for each connected provider
  command.register(() => {
    const providers = provider.providers();
    if (providers.length === 0) return [];

    return providers.map((p) => ({
      title: `Remove ${p.name} Account (${p.id})`,
      value: `remove_provider_${p.id}`,
      category: "Accounts",
      onSelect: async () => {
        await provider.removeProvider(p.id);
        dialog.clear();
        toast.info(`Removed ${p.name} account`);
      },
    }));
  });

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

  const hasProviders = () => provider.providers().length > 0;

  return (
    <box
      width={dimensions().width}
      backgroundColor={theme.background}
      flexGrow={1}
    >
      <box flexDirection="column" flexGrow={1}>
        <Switch>
          <Match when={!hasProviders()}>
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
