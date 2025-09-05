import { TextAttributes } from "@opentui/core";
import { render, useKeyHandler } from "@opentui/solid";
import { For } from "solid-js"
import { useCalendar } from "../useCalendar";
import { format } from "date-fns";


render(() => {
  const { headers, cursorDate, body, navigation } = useCalendar();

  useKeyHandler((key) => {
    switch (key.name) {
      case "l":
        console.log("l pressed")
        navigation.toNext();
        break
      case "h":
        console.log("h pressed")
        navigation.toPrev();
        break
      case "q":
        process.exit(0)
    }
  })

  return (
    <box>
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

      <box flexGrow={1}>
        <For each={body.value}>
          {(week) => {
            const { value: days } = week;

            return (
              <box flexGrow={1} flexDirection="row">
                <For each={days}>
                  {(day) => {
                    const { date, isCurrentDate, isCurrentMonth } = day;

                    return (
                      <box flexGrow={1}
                        style={{
                          minWidth: 15,
                          borderStyle: 'single',
                          border: true,
                          borderColor: isCurrentDate ? 'magenta' : isCurrentMonth ? 'white' : 'gray'
                        }}>
                        <text attributes={
                          isCurrentDate
                            ? TextAttributes.UNDERLINE | TextAttributes.BOLD
                            : isCurrentMonth
                              ? TextAttributes.NONE
                              : TextAttributes.DIM}
                        >
                          {date}
                        </text>
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
