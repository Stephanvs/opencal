import type { Auth } from "@core/auth";
import { createCalendarClient } from "./providers/google";

export async function fetchCalendarEvents(
  token: Auth.Info,
  calendarId: string = "primary",
  timeMin: Date,
  timeMax: Date,
) {
  const calendar = createCalendarClient(token);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

export async function fetchCalendars(token: Auth.Info) {
  const calendar = createCalendarClient(token) as any;

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendars:", error);
    throw error;
  }
}
