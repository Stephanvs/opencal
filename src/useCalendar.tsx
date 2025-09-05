import { addDays, addMonths, addWeeks, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { type WeekDayType, CalendarViewType } from "./models";
import { createSignal, createMemo } from "solid-js";
import { genId, range, withDateProps, withKey, withKeyProps } from "./utils";
import { pipeWith } from "./utils/pipe";
import { createCalendarInfo } from "./createCalendarInfo";

export interface UseCalendarOptions {
  defaultDate?: Date | number | string;
  defaultWeekStart?: WeekDayType;
  defaultViewType?: CalendarViewType;
}

export function useCalendar({
  defaultDate,
  defaultWeekStart = 0,
  defaultViewType = CalendarViewType.Month,
}: UseCalendarOptions = {}) {
  // const baseDate = defaultDate != null ? new Date(defaultDate) : new Date();
  const baseDate = createMemo(() => {
    return defaultDate != null ? new Date(defaultDate) : new Date();
  });

  const [weekStartsOn, setWeekStartsOn] = createSignal(defaultWeekStart);
  const [cursorDate, setCursorDate] = createSignal(baseDate());
  const [viewType, setViewType] = createSignal(defaultViewType);

  const calendar = createCalendarInfo(cursorDate(), { weekStartsOn: weekStartsOn() });
  const { weekdays, weeksInMonth, today, getDateCellByIndex } = calendar;

  const getHeaders = (viewType: CalendarViewType) => {
    switch (viewType) {
      case CalendarViewType.Month:
      case CalendarViewType.Week:
        return {
          weekdays: withKey(weekdays, "weekdays"),
        };
      default:
        return {
          weekdays: withKey([{ value: cursorDate() }], "weekdays"),
        };
    }
  };

  const createMatrix = (weeksInMonth: number) => ({
    value: range(weeksInMonth).map((weekIndex) => {
      return {
        key: genId("weeks"),
        value: range(7).map((dayIndex) => {
          return pipeWith(
            getDateCellByIndex(weekIndex, dayIndex),
            withDateProps(baseDate(), cursorDate()),
            withKeyProps("days"),
          );
        }),
      };
    }),
  });

  const getBody = (viewType: CalendarViewType) => {
    const matrix = createMatrix(weeksInMonth);
    const { weekIndex, dateIndex } = today;

    return {
      [CalendarViewType.Month]: matrix,
      [CalendarViewType.Week]: {
        value: [matrix.value[weekIndex]],
      },
      [CalendarViewType.Day]: {
        value: [
          {
            key: "week-day-type",
            value: [matrix.value[weekIndex]?.value[dateIndex]],
          },
        ],
      },
    }[viewType];
  };

  const setNext = createMemo(() => {
    switch (viewType()) {
      case CalendarViewType.Month:
        return (date: Date) => addMonths(startOfMonth(date), 1);
      case CalendarViewType.Week:
        return (date: Date) => addWeeks(startOfWeek(date, { weekStartsOn: weekStartsOn() }), 1);
      case CalendarViewType.Day:
        return (date: Date) => addDays(date, 1);
    }
  });

  const setPrev = createMemo(() => {
    switch (viewType()) {
      case CalendarViewType.Month:
        return (date: Date) => subMonths(startOfMonth(date), 1);
      case CalendarViewType.Week:
        return (date: Date) => subWeeks(startOfWeek(date, { weekStartsOn: weekStartsOn() }), 1);
      case CalendarViewType.Day:
        return (date: Date) => subDays(date, 1);
    }
  });

  return {
      ...calendar,
      headers: getHeaders(viewType()),
      body: getBody(viewType()),
      navigation: {
        toNext: () => setCursorDate((date) => setNext()(date)),
        toPrev: () => setCursorDate((date) => setPrev()(date)),
        setToday: () => setCursorDate(new Date()),
        setDate: (date: Date) => setCursorDate(date),
      },
      view: {
        type: viewType,
        setViewType,
        setWeekStartsOn,
        isMonthView: viewType() === CalendarViewType.Month,
        isWeekView: viewType() === CalendarViewType.Week,
        isDayView: viewType() === CalendarViewType.Day,
        showMonthView: () => setViewType(CalendarViewType.Month),
        showWeekView: () => setViewType(CalendarViewType.Week),
        showDayView: () => setViewType(CalendarViewType.Day),
      },
    };
}

