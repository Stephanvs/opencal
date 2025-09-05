import { TextAttributes } from "@opentui/core";
import { render } from "@opentui/solid";
import { For } from "solid-js"
import { useCalendar } from "../useCalendar";
import { format } from "date-fns";


render(() => {
  const { headers, cursorDate, body } = useCalendar();

  return (
    <box flexGrow={1}>
      <box border borderStyle="rounded" justifyContent="space-between" flexDirection="row">
        <text attributes={TextAttributes.NONE}>{format(cursorDate, "MMM yyyy")}</text>
        <text>right aligned</text>
      </box>

      <box borderStyle="rounded" flexDirection="row" justifyContent="space-between">
        <For each={headers.weekdays}>
          {({ value }) => (
            <text>{format(value, "E")}</text>
          )}
        </For>
      </box>

      <box borderStyle="rounded" border flexGrow={1}>
        <For each={body.value}>
          {(week) => {
            const { key, value: days } = week;

            return (
              <box flexDirection="row" justifyContent="space-between">
                {/* <text>{key}</text> */}

                <For each={days}>
                  {(day) => {
                    const { key, date, isCurrentDate, isCurrentMonth } = day;

                    return (
                      <box style={{ backgroundColor: isCurrentDate ? "#ddd" : isCurrentMonth ? "#00ff00" : "#cc0000" }}>
                        <text>{date}</text>
                      </box>
                    )
                  }}
                </For>
              </box>
            )
          }}
        </For>
      </box>
    </box>
  )
});
