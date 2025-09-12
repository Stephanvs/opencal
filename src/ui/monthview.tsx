import { TextAttributes } from "@opentui/core";
import { render, useKeyHandler, useRenderer } from "@opentui/solid";
import { For, createMemo } from "solid-js"
import { useCalendar } from "../useCalendar";
import { format, addDays, subDays } from "date-fns";
import { isSameDate } from "../utils";
import ViewSelector from "./components/view-selector";

render(() => {
  const { headers, cursorDate, body, navigation, view } = useCalendar();
  const renderer = useRenderer()

  const formattedMonth = createMemo(() => format(cursorDate(), "MMM yyyy"));
  const formattedDate = createMemo(() => format(cursorDate(), "dd-MM-yyyy"));

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
      case "j":
        navigation.setDate(addDays(cursorDate(), 1));
        console.log('next day', cursorDate());
        break;
      case "k":
        navigation.setDate(subDays(cursorDate(), 1));
        console.log('next day', cursorDate());
        break;
      case "m":
        view.showMonthView();
        console.log('switched to month view');
        break;
      case "w":
        view.showWeekView();
        console.log('switched to week view');
        break;
      case "d":
        view.showDayView();
        console.log('switched to day view');
        break;
      case "q":
        process.exit(0);
    }
  })

  return (
    <box>
      <box border borderStyle="rounded" justifyContent="space-between" flexDirection="row">
        <text attributes={TextAttributes.NONE}>{formattedMonth()}</text>
        {/* <text>{view.type()}</text> */}
        <ViewSelector currentViewMode={view.type()} />
        <text>{formattedDate()}</text>
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
                    const { date, isCurrentDate, isCurrentMonth } = day;

                    console.log('date', day.value, 'cursorDate', cursorDate());

                    return (
                      <box
                        flexGrow={1}
                        style={{
                          minWidth: 5,
                          border: true,
                          borderStyle: isSameDate(day.value, cursorDate())
                            ? 'double'
                            : 'single',
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
