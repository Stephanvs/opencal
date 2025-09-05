import { 
  isWeekend as _isWeekend,
  getDate,
  isEqual,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds } from "date-fns";
import type { DateCell } from "./models";

export const range = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

let randomId = 0;
const map = new Map<string, number>();

export function genId(prefix: string) {
  if (map.has(prefix)) {
    const id = map.get(prefix);
    const newId = id! + 1;
    map.set(prefix, newId);
    randomId = newId;
  } else {
    const id = 1;
    map.set(prefix, id);
    randomId = id;
  }

  return `${prefix}-${randomId}`;
}

export function withKey<T>(arr: T[], prefix: string) {
  return arr.map(v => {
    return {
      ...v,
      key: genId(prefix),
    };
  });
}

export function withKeyProps(keyPrefix: string) {
  return <T extends DateCell>(cell: T) => ({
    ...cell,
    key: genId(keyPrefix),
  });
}

export function withDateProps(baseDate: Date, cursorDate: Date) {
  return <T extends DateCell>(cell: T) => {
    const { value: targetDate } = cell;
    const isCurrentMonth = isSameYearAndMonth(cursorDate, targetDate);
    const isCurrentDate = isSameDate(baseDate, targetDate);
    const isWeekend = _isWeekend(targetDate);

    return {
      ...cell,
      date: getDate(targetDate),
      isCurrentMonth,
      isCurrentDate,
      isWeekend,
    };
  };
}

import { isSameMonth as _isSameMonth, isSameYear } from "date-fns";
export function isSameYearAndMonth(baseDate: Date, targetDate: Date) {
  return _isSameMonth(targetDate, baseDate) && isSameYear(targetDate, baseDate);
}


export function isSameDate(baseDate: Date, targetDate: Date) {
  const base = resetTimeOfDate(baseDate);
  const target = resetTimeOfDate(targetDate);

  return isEqual(base, target);
}


export default function resetTimeOfDate(date: Date) {
  return setHours(setMinutes(setSeconds(setMilliseconds(date, 0), 0), 0), 0);
}

export function parseDate(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}
