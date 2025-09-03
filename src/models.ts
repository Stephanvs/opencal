export interface DateCell extends Record<string, unknown> {
  value: Date;
}

export interface WeekRow extends Record<string, unknown> {
  value: DateCell[];
}

export interface MonthMatrix extends Record<string, unknown> {
  value: WeekRow[];
}

export enum CalendarViewType {
  Month = "month",
  Week = "week",
  Day = "day",
}

export type WeekDayType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
