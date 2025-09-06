import { TextAttributes } from "@opentui/core";
import { render, useKeyHandler, useRenderer } from "@opentui/solid";
import { For } from "solid-js"
import { useCalendar } from "../useCalendar";
import { format } from "date-fns";
import { CalendarViewType } from "../models";

render(() => {
  const { headers, cursorDate, body, navigation, view } = useCalendar();
  const renderer = useRenderer()

  useKeyHandler((key) => {

    if (key.name === "`" || key.name === '"') {
      renderer.console.toggle();
    }

    switch (key.name) {
      case "t":
        var newDate = navigation.setToday();
        console.log("t pressed", newDate);
        break;
      case "l":
        var newDate = navigation.toNext();
        console.log("l pressed", newDate);
        break;
      case "h":
        var newDate = navigation.toPrev();
        console.log("h pressed", newDate)
        break;
      case "m":
        view.setViewType(CalendarViewType.Month);
        console.log('switched to month view');
        break;
      case "w":
        view.setViewType(CalendarViewType.Week);
        console.log('switched to week view');
        break;
      case "d":
        view.setViewType(CalendarViewType.Day);
        console.log('switched to day view');
        break;
      case "q":
        process.exit(0);
    }
  })

  return (
    <box>
      <box border borderStyle="rounded" justifyContent="space-between" flexDirection="row">
        <text attributes={TextAttributes.NONE}>{format(cursorDate, "MMM yyyy")}</text>
        <text>{view.type}</text>
        <text>{format(cursorDate, "dd-MM-yyyy")}</text>
      </box>

      <box borderStyle="rounded" flexDirection="row" justifyContent="space-between">
        <For each={headers().weekdays}>
          {({ value }) => (
            <text>{format(value, "E")}</text>
          )}
        </For>
      </box>

      <box flexGrow={1}>
        <For each={body().value}>
          {(week) => {
            const { value: days } = week;

            return (
              <box flexGrow={1} flexDirection="row">
                <For each={days}>
                  {(day) => {
                    const { date, isCurrentDate, isCurrentMonth, isWeekend } = day;

                    return (
                      <box
                        flexGrow={1}
                        margin={0}
                        style={{
                          minWidth: 5,
                          borderStyle: 'single',
                          border: true,
                          borderColor: isCurrentDate
                            ? 'yellow'
                            : isCurrentMonth
                              ? 'white'
                              : 'gray'
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
