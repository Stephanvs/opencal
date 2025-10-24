import { Theme } from "./context/theme";
import { CalendarView } from "./monthview";

export function Home() {
  return (
    <box flexGrow={1}>
      <CalendarView />
    </box>
  )
}

function Logo() {
  return (
    <box>
      <box flexDirection="row">
        <ascii_font text="opencal" />
      </box>
      <box flexDirection="row" justifyContent="flex-end">
        <text fg={Theme.textMuted}>todo</text>
      </box>
    </box>
  )
}
