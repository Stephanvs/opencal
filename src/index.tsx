import { createEffect, Match, Switch } from "solid-js";
import { RouteProvider, useRoute } from "./context/route"
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { Home } from "./ui/home";
import { TextAttributes } from "@opentui/core";
import { Theme } from "./context/theme";
import { DialogProvider, useDialog } from "./ui/components/dialog";

render(
  () =>
    <RouteProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </RouteProvider>,
  {
    consoleOptions: {
      titleBarColor: "#cc33ff"
    }
  }
);

function App() {
  const route = useRoute()
  const dimensions = useTerminalDimensions()
  const renderer = useRenderer()
  const dialog = useDialog()

  useKeyboard(async (evt) => {
    if (evt.meta && evt.name === "t") {
      renderer.toggleDebugOverlay()
      return
    }
  })

  createEffect(() => {
    console.log(JSON.stringify(route.data))
  })

  return (
    <box width={dimensions().width} backgroundColor={Theme.background}>
      <box flexDirection="column" flexGrow={1}>
        <Switch>
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
            {/*   <text fg={Theme.textMuted}>{process.cwd().replace(Global.Path.home, "~")}</text> */}
          </box>
        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={Theme.textMuted}>
            tab
          </text>
          {/* <text fg={local.agent.color(local.agent.current().name)}>┃</text> */}
          {/* <text bg={local.agent.color(local.agent.current().name)} fg={Theme.background}> */}
          {" "}
          {/*   {bold(local.agent.current().name.toUpperCase())} AGENT{" "} */}
          {/* </text> */}
        </box>
      </box>
    </box>
  );
};
