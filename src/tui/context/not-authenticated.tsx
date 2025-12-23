import { useTheme } from "./theme"

export function NotAuthenticated() {
  const { theme } = useTheme()
  
  return (
    <box flexDirection="column" alignItems="center" padding={2}>
      <text fg={theme.textMuted}>Not Authenticated</text>
      <box paddingTop={1}>
        <text>To use OpenCal, please authenticate:</text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.primary}>Press ctrl+p and select "Authenticate with Google"</text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.textMuted}>or via CLI:</text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.primary}>$ opencal auth login google</text>
      </box>
      <box paddingTop={2}>
        <text fg={theme.textMuted}>Press ctrl+c to quit</text>
      </box>
    </box>
  )
}
