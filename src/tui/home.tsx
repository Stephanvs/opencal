import { Theme } from "./context/theme"
import { bold, fg } from "@opentui/core"
import { CalendarView } from "./monthview";

export function Home() {
  return (
    <box flexGrow={1} justifyContent="center" alignItems="center">
      <box>
        <Logo />
        <box paddingTop={2}>
          <CalendarView />
        </box>
      </box>
      {/* <box paddingTop={3} minWidth={75}> */}
      {/*   <Prompt /> */}
      {/* </box> */}
    </box>
  )
}

function HelpRow(props: { children: string; slash: string }) {
  return (
    <text>
      {bold(fg(Theme.primary)("/" + props.slash.padEnd(10, " ")))} {props.children.padEnd(15, " ")}{" "}
      {fg(Theme.textMuted)("ctrl+x n")}
    </text>
  )
}

function Logo() {
  return (
    <box>
      <box flexDirection="row">
        <ascii_font text="opencal" />
      </box>
      <box flexDirection="row" justifyContent="flex-end">
        {/* <text fg={Theme.textMuted}>{Installation.VERSION}</text> */}
      </box>
    </box>
  )
}
