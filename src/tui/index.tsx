import { createEffect, Match, Switch } from "solid-js"
import { render, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import { TextAttributes } from "@opentui/core"
import { RouteProvider, useRoute } from "./context/route"
import { Home } from "./home"
import { ThemeProvider, useTheme } from "./context/theme"
import { DialogProvider, useDialog } from "./components/dialog"
import { AuthProvider, useAuth } from "./context/auth"
import { CommandProvider, useCommandDialog } from "./components/dialog-command"
import { NotAuthenticated } from "./context/not-authenticated"
import { KeybindProvider } from "./context/keybind"
import { authorize } from "@core/auth/oauth-flow"
import logger from "@core/logger"
import { Toast, ToastProvider, useToast } from "./ui/toast"

render(
  () => (
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
  const toast = useToast()
  const { theme, all, selected, mode, set, toggleMode } = useTheme()

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
                toast.success("Successfully authenticated with Google!")
              } else {
                logger.error("OAuth failed:", result.error)
                dialog.clear()
                toast.error(new Error(result.error ?? "OAuth authentication failed"))
              }
            } catch (error) {
              logger.error("OAuth error:", error)
              dialog.clear()
              toast.error(error)
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
          toast.info("You have been logged out")
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
    {
      title: "Show success toast",
      value: "toast_success",
      category: "Debug",
      onSelect: () => {
        toast.success("Operation completed successfully!")
        dialog.clear()
      },
    },
    {
      title: "Show error toast",
      value: "toast_error",
      category: "Debug",
      onSelect: () => {
        toast.error(new Error("Something went wrong"))
        dialog.clear()
      },
    },
    {
      title: "Show info toast",
      value: "toast_info",
      category: "Debug",
      onSelect: () => {
        toast.info("Here is some information")
        dialog.clear()
      },
    },
    {
      title: "Show warning toast",
      value: "toast_warning",
      category: "Debug",
      onSelect: () => {
        toast.warning("This is a warning message")
        dialog.clear()
      },
    },
  ])

  // Theme commands
  command.register(() => [
    ...all().map((themeName) => ({
      title: `Theme: ${themeName}${selected === themeName ? " (active)" : ""}`,
      value: `theme_${themeName}`,
      category: "Appearance",
      onSelect: () => {
        set(themeName)
        dialog.clear()
      },
    })),
    {
      title: `Toggle dark/light mode (${mode})`,
      value: "theme_toggle_mode",
      category: "Appearance",
      onSelect: () => {
        toggleMode()
        dialog.clear()
      },
    },
  ])

  return (
    <box width={dimensions().width} backgroundColor={theme.background}>
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
            <text attributes={TextAttributes.BOLD}>cal </text>
          </box>

        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={theme.textMuted}>
            ctrl+p
          </text>
        </box>
      </box>

      {/* Toast notifications */}
      <Toast />
    </box>
  )
}
