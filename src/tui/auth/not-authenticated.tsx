import { useTheme } from "@tui/context/theme";

export function NotAuthenticated() {
  const { theme } = useTheme();

  return (
    <box flexDirection="column" flexGrow={1} alignItems="center" padding={2}>
      <text fg={theme.textMuted}>No Accounts Connected</text>
      <box paddingTop={1}>
        <text>To use OpenCal, please add a calendar account:</text>
      </box>
      <box paddingTop={1}>
        <text fg={theme.primary}>
          Press ctrl+p and select "Add Google Account"
        </text>
      </box>
      <box paddingTop={2}>
        <text fg={theme.textMuted}>Press ctrl+c to quit</text>
      </box>
    </box>
  );
}
