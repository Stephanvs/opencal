import { createEffect, Match, Switch } from "solid-js";
import { RouteProvider, useRoute } from "./context/route"
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";
import { Home } from "./home";
import { Theme } from "./context/theme";
import { DialogProvider, useDialog } from "./components/dialog";
import { AuthProvider, useAuth } from "./context/auth";
import { CommandProvider, useCommandDialog } from "./components/dialog-command";
import { NotAuthenticated } from "./context/not-authenticated";
import logger from '@core/logger';
import { KeybindProvider } from "./context/keybind";

render(
  () =>
    <AuthProvider>
      <RouteProvider>
        <KeybindProvider>
          <DialogProvider>
            <CommandProvider>
              <App />
            </CommandProvider>
          </DialogProvider>
        </KeybindProvider>
      </RouteProvider>
    </AuthProvider>,
  {
    targetFps: 60,
    gatherStats: false,
    useKittyKeyboard: true,
    consoleOptions: {
      titleBarColor: "#cc33ff"
    }
  }
);

function App() {
  const auth = useAuth();
  const route = useRoute()
  const dimensions = useTerminalDimensions()
  const renderer = useRenderer()
  const dialog = useDialog()
  const command = useCommandDialog()

  useKeyboard(async (evt) => {
    if (evt.name === "`") {
      renderer.console.toggle()
      // renderer.toggleDebugOverlay()
      return
    }
  })

  createEffect(() => {
    logger.info(JSON.stringify(route.data))
  })

  command.register(() => [
    {
      title: "Switch theme",
      value: "preferences_theme",
      keybind: "theme_list",
      category: "Preferences",
      onSelect: () => {
        dialog.replace(() => <text>hi from command</text>)
        // dialog.replace(() => <DialogThemeSwitch />)
      },
    },
  ])

  return (
    <box width={dimensions().width} backgroundColor={Theme.background}>
      <box flexDirection="column" flexGrow={1}>
        <Switch>
          <Match when={auth.data.type === 'unauthorized'}>
            <NotAuthenticated />
          </Match>
          {/* <Match when={route.data.type === "session"}> */}
          {/*   <Session /> */}
          {/* </Match> */}
          <Match when={route.data.type === "home"}>
            <Home />
          </Match>
        </Switch>
      </box>

      {/* status bar */}
      <box height={1} backgroundColor={Theme.backgroundPanel} flexDirection="row" justifyContent="space-between">
        <box flexDirection="row">
          <box flexDirection="row" backgroundColor={Theme.backgroundElement} paddingLeft={1} paddingRight={1}>
            <text fg={Theme.textMuted}>open</text>
            <text attributes={TextAttributes.BOLD}>cal </text>
            {/* <text fg={Theme.textMuted}>v0.0.1{Installation.VERSION}</text> */}
          </box>
          <box paddingLeft={1} paddingRight={1}>
            <text>hello</text>
          </box>
        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={Theme.textMuted}>
            tab
          </text>
        </box>
      </box>
    </box>
  );
};
