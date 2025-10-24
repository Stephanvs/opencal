/**
 * Google Calendar API Client
 *
 * Provides functions to interact with Google Calendar API.
 */

import { google } from 'googleapis';
import type { TokenData } from './types';

/**
 * Create a Google Calendar API client with authenticated credentials
 */
export function createCalendarClient(token: TokenData) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: token.access,
    refresh_token: token.refresh,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

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
  const calendar = createCalendarClient(token);

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendars:', error);
    throw error;
  }
}