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

// Shared signal that triggers re-render at midnight
const [midnight, setMidnight] = createSignal(0);
const scheduleMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  setTimeout(() => { setMidnight(n => n + 1); scheduleMidnight(); }, next.getTime() - now.getTime() + 100);
};
scheduleMidnight();

export function useCalendar({
  defaultDate,
  defaultWeekStart = 0,
  defaultViewType = CalendarViewType.Month,
}: UseCalendarOptions = {}) {
  const baseDate = defaultDate != null ? new Date(defaultDate) : new Date();

  const [weekStartsOn, setWeekStartsOn] = createSignal(defaultWeekStart);
  const [cursorDate, setCursorDate] = createSignal(baseDate);
  const [viewType, setViewType] = createSignal(defaultViewType);

  const calendar = createMemo(() => createCalendarInfo(cursorDate(), { weekStartsOn: weekStartsOn() }));
  const weekdays = () => calendar().weekdays;
  const weeksInMonth = () => calendar().weeksInMonth;
  const today = () => calendar().today;
  const getDateCellByIndex = (weekIndex: number, dayIndex: number) => calendar().getDateCellByIndex(weekIndex, dayIndex);

  const getHeaders = (viewType: CalendarViewType) => {
    switch (viewType) {
      case CalendarViewType.Month:
      case CalendarViewType.Week:
        return {
          weekdays: withKey(weekdays(), "weekdays"),
        };
      default:
        return {
          weekdays: withKey([{ value: cursorDate() }], "weekdays"),
        };
    }
  };

  const createMatrix = (weeksInMonth: number, today: Date) => ({
    value: range(weeksInMonth).map((weekIndex) => {
      return {
        key: genId("weeks"),
        value: range(7).map((dayIndex) => {
          return pipeWith(
            getDateCellByIndex(weekIndex, dayIndex),
            withDateProps(today, cursorDate()),
            withKeyProps("days"),
          );
        }),
      };
    }),
  });

  const getBody = (viewType: CalendarViewType) => {
    midnight(); // Subscribe to midnight updates
    const matrix = createMatrix(weeksInMonth(), new Date());
    const { weekIndex, dateIndex } = today();

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

  const viewTypeMemo = createMemo(() => viewType());

  const { cursorDate: _, ...cal } = calendar();

  return {
      cursorDate,
      ...cal,
      headers: createMemo(() => getHeaders(viewType())),
      body: createMemo(() => getBody(viewType())),
      navigation: {
        toNext: () => setCursorDate((date) => setNext()(date)),
        toPrev: () => setCursorDate((date) => setPrev()(date)),
        setToday: () => setCursorDate(new Date()),
        setDate: (date: Date) => setCursorDate(date),
      },
      view: {
        type: viewTypeMemo,
        setViewType,
        setWeekStartsOn,
        isMonthView: createMemo(() => viewTypeMemo() === CalendarViewType.Month),
        isWeekView: createMemo(() => viewTypeMemo() === CalendarViewType.Week),
        isDayView: createMemo(() => viewTypeMemo() === CalendarViewType.Day),
        showMonthView: () => setViewType(CalendarViewType.Month),
        showWeekView: () => setViewType(CalendarViewType.Week),
        showDayView: () => setViewType(CalendarViewType.Day),
      },
    };
}

