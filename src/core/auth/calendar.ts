/**
 * Google Calendar API Client
 *
 * Provides functions to interact with Google Calendar API.
 */

import type { TokenData } from './types';
import { createCalendarClient } from './providers/google';

/**
 * Fetch calendar events for a given time range
 */
export async function fetchCalendarEvents(
  token: TokenData,
  calendarId: string = 'primary',
  timeMin: Date,
  timeMax: Date
) {
  const calendar = createCalendarClient(token);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

/**
 * Get list of calendars
 */
export async function fetchCalendars(token: TokenData) {
  const calendar = createCalendarClient(token) as any;

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendars:', error);
    throw error;
  }
}
