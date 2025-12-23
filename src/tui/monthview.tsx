import { TextAttributes } from "@opentui/core";
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid";
import { For, createMemo, createResource } from "solid-js"
import { useCalendar } from "../useCalendar";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { isSameDate } from "../utils";
import ViewSelector from "./components/view-selector";
import { useAuth } from "./context/auth";
import { fetchCalendars, fetchCalendarEvents } from "@core/auth/calendar";
import { CalendarViewType } from "../models";
import logger from '@core/logger';
import { Theme } from "./context/theme";

export function CalendarView() {
  const { headers, cursorDate, body, navigation, view } = useCalendar();
  const renderer = useRenderer()
  const dimensions = useTerminalDimensions()

  const formattedMonth = createMemo(() => format(cursorDate(), "MMM yyyy"));
  const formattedDate = createMemo(() => format(cursorDate(), "dd-MM-yyyy"));

  const auth = useAuth()

  const dayWidth = createMemo(() => {
    const totalWidth = dimensions().width;
    switch (view.type()) {
      case CalendarViewType.Month:
      case CalendarViewType.Week:
        return Math.floor(totalWidth / 7);
      case CalendarViewType.Day:
        return totalWidth;
    }
  })

  const timeMin = createMemo(() => {
    switch (view.type()) {
      case CalendarViewType.Month: return startOfMonth(cursorDate())
      case CalendarViewType.Week: return startOfWeek(cursorDate(), {weekStartsOn: 0})
      case CalendarViewType.Day: return startOfDay(cursorDate())
    }
  })

  const timeMax = createMemo(() => {
    switch (view.type()) {
      case CalendarViewType.Month: return endOfMonth(cursorDate())
      case CalendarViewType.Week: return endOfWeek(cursorDate(), {weekStartsOn: 0})
      case CalendarViewType.Day: return endOfDay(cursorDate())
    }
  })

  const [events] = createResource(() => ({token: auth.data.type === 'google' ? auth.data.token : null, timeMin: timeMin(), timeMax: timeMax()}), async ({token, timeMin, timeMax}) => {
    if (!token) return []
    const cals = await fetchCalendars(token)
    const allEvents = []
    for (const cal of cals) {
      if (!cal.id) continue
      const evs = await fetchCalendarEvents(token, cal.id, timeMin, timeMax)
      allEvents.push(...evs)
    }
    return allEvents
  })

  const eventsByDate = createMemo(() => {
    const map = new Map()
    for (const event of events() || []) {
      if (!event.start) continue
      const dateStr = event.start.date || (event.start.dateTime ? event.start.dateTime.split('T')[0] : null)
      if (!dateStr) continue
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr).push(event)
    }
    return map
  })

  useKeyboard(async (key) => {

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
        logger.debug('next day', cursorDate());
        break;
      case "k":
        navigation.setDate(subDays(cursorDate(), 1));
        logger.debug('next day', cursorDate());
        break;
      case "m":
        view.showMonthView();
        logger.debug('switched to month view');
        break;
      case "w":
        view.showWeekView();
        logger.debug('switched to week view');
        break;
      case "d":
        view.showDayView();
        logger.debug('switched to day view');
        break;
      case "q":
        process.exit(0);
    }
  })

  return (
    <box width={dimensions().width} height={dimensions().height - 1}>
      <box
        height={1}
        backgroundColor={Theme.backgroundPanel}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box flexDirection="row">
          <box
            flexDirection="row"
            backgroundColor={Theme.backgroundElement}
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
          <text paddingRight={1} fg={Theme.textMuted}>
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

                    logger.debug('date', day.value, 'cursorDate', cursorDate());

                    return (
                      <box
                        width={dayWidth()}
                        style={{
                          backgroundColor: isSameDate(day.value, cursorDate())
                            ? Theme.accent
                            : isCurrentDate
                              ? Theme.backgroundElement
                              : Theme.background
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
                        <For each={eventsByDate().get(format(day.value, 'yyyy-MM-dd'))?.slice(0, 3) || []}>
                          {(event) => <text attributes={TextAttributes.DIM}>{event.summary.slice(0, 20)}{event.summary.length > 20 ? '...' : ''}</text>}
                        </For>
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
}
