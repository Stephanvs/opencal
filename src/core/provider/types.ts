import type { IncomingMessage, ServerResponse } from "node:http";

export type ProviderId = string;
export type CalendarId = string;

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Calendar {
  id: CalendarId;
  name: string;
  color?: string;
  primary?: boolean;
}

export interface CalendarEvent {
  id: string;
  providerId: ProviderId;
  calendarId: CalendarId;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
}

export interface InitContext {
  openBrowser: (url: string) => Promise<void>;
  waitForCallback: <T>(
    handler: (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
    ) => T | Promise<T>,
  ) => Promise<T>;
}

export interface Provider {
  readonly id: ProviderId;
  readonly name: string;
  enabled: boolean;

  /**
   * Initialize this provider (only for new instances).
   * Runs auth flow and sets ID from response.
   */
  init(ctx: InitContext): Promise<boolean>;

  /** Fetch calendars with enabled state */
  getCalendars(): Promise<Calendar[]>;

  /** Fetch events from enabled calendars only */
  getEvents(range: TimeRange): Promise<CalendarEvent[]>;
}

export interface ProviderFactory {
  readonly name: string;
  create(): Provider;
  fromConfig(config: unknown): Provider;
}
