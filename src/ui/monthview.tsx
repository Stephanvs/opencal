import { TextAttributes } from "@opentui/core";
import { render } from "@opentui/solid";
import { For } from "solid-js"

const currentDay = new Date().getDay();
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

render(() => (
  <box flexGrow={1}>
    <box border={true} borderStyle="rounded" justifyContent="space-between" flexDirection="row">
      <text attributes={TextAttributes.NONE}>August 2025</text>
      <text>right aligned</text>
    </box>
    <box backgroundColor={'#4444cc'} flexGrow={1}>
      <For each={days}>
        {(day, idx) => (
          <text attributes={currentDay -1 === idx() ? TextAttributes.BOLD : TextAttributes.NONE}>{day}</text>
        )}
      </For>
    </box>
  </box>
));
