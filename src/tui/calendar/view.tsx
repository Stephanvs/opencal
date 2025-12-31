import { parseDate } from "chrono-node";
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { For, createMemo } from "solid-js";

import { TextAttributes } from "@opentui/core";
import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/solid";

import { logger } from "@core/logger";
import type { CalendarEvent } from "@core/provider";

import { CalendarViewType } from "../../models";
import { useCalendar } from "../../useCalendar";
import { isSameDate } from "../../utils";
import { useTheme } from "../context/theme";
import { useDialog } from "../dialog/dialog";
import { useCommandDialog } from "../dialog/dialog-command";
import { DialogPrompt } from "../dialog/dialog-prompt";
import { useProvider } from "../provider";
import { ViewSelector } from "./view-selector";

export function CalendarView() {
  const { headers, cursorDate, body, navigation, view } = useCalendar();
  const renderer = useRenderer();
  const dimensions = useTerminalDimensions();
  const dialog = useDialog();
  const { theme } = useTheme();
  const provider = useProvider();

  const formattedMonth = createMemo(() => format(cursorDate(), "MMM yyyy"));
  const formattedDate = createMemo(() => format(cursorDate(), "dd-MM-yyyy"));

  const command = useCommandDialog();

  command.register(() => [
    {
      title: "Go to",
      value: "go_to",
      category: "Navigation",
      onSelect: () => {
        dialog.replace(() => (
          <DialogPrompt
            title="Go to"
            description={
              <text style={{ fg: theme.textMuted }}>
                A natural language date
              </text>
            }
            placeholder="Monday, next week, or December 31"
            onConfirm={(date) => {
              const parsed = parseDate(date);
              if (parsed) {
                navigation.setDate(parsed);
              }
              dialog.clear();
            }}
          />
        ));
      },
    },
    {
      title: "Go to today",
      value: "today",
      category: "Navigation",
      onSelect: () => {
        navigation.setToday();
        dialog.clear();
      },
    },
    {
      title: "Show month view",
      value: "month_view",
      category: "View",
      onSelect: () => {
        view.showMonthView();
        dialog.clear();
      },
    },
    {
      title: "Show week view",
      value: "week_view",
      category: "View",
      onSelect: () => {
        view.showWeekView();
        dialog.clear();
      },
    },
    {
      title: "Show day view",
      value: "day_view",
      category: "View",
      onSelect: () => {
        view.showDayView();
        dialog.clear();
      },
    },
  ]);

  const dayWidth = createMemo(() => {
    const totalWidth = dimensions().width;
    switch (view.type()) {
      case CalendarViewType.Month:
      case CalendarViewType.Week:
        return Math.floor(totalWidth / 7);
      case CalendarViewType.Day:
        return totalWidth;
    }
  });

  const timeMin = createMemo(() => {
    switch (view.type()) {
      case CalendarViewType.Month:
        return startOfMonth(cursorDate());
      case CalendarViewType.Week:
        return startOfWeek(cursorDate(), { weekStartsOn: 0 });
      case CalendarViewType.Day:
        return startOfDay(cursorDate());
    }
  });

  const timeMax = createMemo(() => {
    switch (view.type()) {
      case CalendarViewType.Month:
        return endOfMonth(cursorDate());
      case CalendarViewType.Week:
        return endOfWeek(cursorDate(), { weekStartsOn: 0 });
      case CalendarViewType.Day:
        return endOfDay(cursorDate());
    }
  });

  const timeRange = createMemo(() => ({
    start: timeMin(),
    end: timeMax(),
  }));

  const events = provider.createEventsResource(timeRange);

  const eventsByDate = createMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events() ?? []) {
      const dateStr = format(event.start, "yyyy-MM-dd");
      const existing = map.get(dateStr);
      if (existing) {
        existing.push(event);
      } else {
        map.set(dateStr, [event]);
      }
    }
    return map;
  });

  useKeyboard(async (key) => {
    // Ignore keyboard events when dialog is open
    if (dialog.isOpen) return;

    if (key.name === "`" || key.name === '"') {
      renderer.console.toggle();
    }

    switch (key.name) {
      case "t": {
        const newDate = navigation.setToday();
        logger.debug("t pressed", newDate);
        break;
      }
      case "l": {
        const newDate = navigation.toNext();
        logger.debug("l pressed", newDate);
        break;
      }
      case "h": {
        const newDate = navigation.toPrev();
        logger.debug("h pressed", newDate);
        break;
      }
      case "j":
        navigation.setDate(addDays(cursorDate(), 1));
        logger.debug("next day", cursorDate());
        break;
      case "k":
        navigation.setDate(subDays(cursorDate(), 1));
        logger.debug("next day", cursorDate());
        break;
      case "m":
        view.showMonthView();
        logger.debug("switched to month view");
        break;
      case "w":
        view.showWeekView();
        logger.debug("switched to week view");
        break;
      case "d":
        view.showDayView();
        logger.debug("switched to day view");
        break;
      case "q":
        process.exit(0);
    }
  });

  return (
    <box width={dimensions().width} height={dimensions().height - 1}>
      <box
        height={1}
        backgroundColor={theme.backgroundPanel}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row">
          <box
            flexDirection="row"
            backgroundColor={theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
          >
            <text attributes={TextAttributes.BOLD}>{formattedMonth()}</text>
          </box>
          <box paddingLeft={1} paddingRight={1}>
            <ViewSelector currentViewMode={view.type()} />
          </box>
        </box>
        <box flexDirection="row">
          <text paddingRight={1} fg={theme.textMuted}>
            {formattedDate()}
          </text>
        </box>
      </box>

      <box flexDirection="row">
        <For each={headers().weekdays}>
          {({ value }) => (
            <box width={dayWidth()}>
              <text>{format(value, "E")}</text>
            </box>
          )}
        </For>
      </box>

      <box flexGrow={1}>
        <For each={body().value}>
          {(week) => {
            if (!week) return null;
            const { value: days } = week;

            return (
              <box flexGrow={1} flexDirection="row">
                <For each={days}>
                  {(day) => {
                    if (!day) return null;
                    const { date, isCurrentDate, isCurrentMonth } = day;

                    return (
                      <box
                        width={dayWidth()}
                        style={{
                          backgroundColor: isSameDate(day.value, cursorDate())
                            ? theme.primary
                            : isCurrentDate
                              ? theme.backgroundElement
                              : theme.background,
                        }}
                      >
                        <text
                          attributes={
                            isCurrentDate
                              ? TextAttributes.UNDERLINE | TextAttributes.BOLD
                              : isCurrentMonth
                                ? TextAttributes.NONE
                                : TextAttributes.DIM
                          }
                        >
                          {date}
                        </text>
                        <For
                          each={
                            eventsByDate()
                              .get(format(day.value, "yyyy-MM-dd"))
                              ?.slice(0, 3) ?? []
                          }
                        >
                          {(event) => (
                            <text attributes={TextAttributes.DIM}>
                              {event.summary.slice(0, 20)}
                              {event.summary.length > 20 ? "..." : ""}
                            </text>
                          )}
                        </For>
                      </box>
                    );
                  }}
                </For>
              </box>
            );
          }}
        </For>
      </box>
    </box>
  );
}
