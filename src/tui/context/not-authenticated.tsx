import { Theme } from "./theme";

export function NotAuthenticated() {
  return (
    <box flexDirection="column" alignItems="center" padding={2}>
      <text fg={Theme.textMuted}>Not Authenticated</text>
      <box paddingTop={1}>
        <text>To use OpenCal, please authenticate:</text>
      </box>
      <box paddingTop={1}>
        <text fg={Theme.primary}>$ opencal auth login google</text>
      </box>
      <box paddingTop={2}>
        <text fg={Theme.textMuted}>Press 'ctrl+c' to quit</text>
      </box>
    </box>
  )
}

