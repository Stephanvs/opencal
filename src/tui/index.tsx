import { createEffect, Match, Switch } from "solid-js"
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import { TextAttributes } from "@opentui/core"
import { RouteProvider, useRoute } from "./context/route"
import { Home } from "./home"
import { Theme } from "./context/theme"
import { DialogProvider, useDialog } from "./components/dialog"
import { AuthProvider, useAuth } from "./context/auth"
import { CommandProvider, useCommandDialog } from "./components/dialog-command"
import { NotAuthenticated } from "./context/not-authenticated"
import { KeybindProvider } from "./context/keybind"
import { authorize } from "@core/auth/oauth-flow"
import logger from "@core/logger"

render(
  () => (
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
    </AuthProvider>
  ),
  {
    targetFps: 60,
    gatherStats: false,
    useKittyKeyboard: true,
    consoleOptions: {
      titleBarColor: "#cc33ff",
    },
  },
)

function App() {
  const auth = useAuth()
  const route = useRoute()
  const dimensions = useTerminalDimensions()
  const renderer = useRenderer()
  const dialog = useDialog()
  const command = useCommandDialog()

  useKeyboard(async (evt) => {
    if (evt.name === "`") {
      renderer.console.toggle()
      return
    }
  })

  createEffect(() => {
    logger.info(JSON.stringify(route.data))
  })

  // Register commands based on auth state
  command.register(() => {
    if (auth.data.type === "unauthorized") {
      return [
        {
          title: "Authenticate with Google",
          value: "auth_google_login",
          category: "Authentication",
          suggested: true,
          onSelect: async () => {
            // Show waiting dialog
            dialog.replace(() => (
              <box paddingLeft={3} paddingRight={3} paddingTop={1} paddingBottom={1}>
                <text>Waiting for browser...</text>
              </box>
            ))

            try {
              const result = await authorize()
              if (result.success && result.tokens) {
                auth.google_login(result.tokens)
                dialog.clear()
              } else {
                logger.error("OAuth failed:", result.error)
                dialog.clear()
              }
            } catch (error) {
              logger.error("OAuth error:", error)
              dialog.clear()
            }
          },
        },
      ]
    }

    // Authenticated state
    return [
      {
        title: "Logout",
        value: "auth_logout",
        category: "Authentication",
        onSelect: () => {
          auth.logout()
          dialog.clear()
        },
      },
    ]
  })

  // System commands (always available)
  command.register(() => [
    {
      title: "Toggle debug panel",
      value: "app_debug",
      category: "System",
      onSelect: () => {
        renderer.toggleDebugOverlay()
        dialog.clear()
      },
    },
    {
      title: "Toggle console",
      value: "app_console",
      category: "System",
      onSelect: () => {
        renderer.console.toggle()
        dialog.clear()
      },
    },
  ])

  return (
    <box width={dimensions().width} backgroundColor={Theme.background}>
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
        backgroundColor={Theme.backgroundPanel}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row">
          <box
            flexDirection="row"
            backgroundColor={Theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={Theme.textMuted}>open</text>
            <text attributes={TextAttributes.BOLD}>cal </text>
          </box>

        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={Theme.textMuted}>
            ctrl+p
          </text>
        </box>
      </box>
    </box>
  )
}
