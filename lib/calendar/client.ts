import { google, calendar_v3 } from 'googleapis';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

class GoogleCalendarClient {
  private calendar: calendar_v3.Calendar;
  private calendarId: string;

  constructor() {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is required');
    }
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID is required');
    }

    this.calendarId = calendarId;

    // Parse service account credentials
    const parsedCredentials = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async listEvents(
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10
  ): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }

  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  async createEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
    });

    return response.data;
  }

  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.update({
      calendarId: this.calendarId,
      eventId: eventId,
      requestBody: event,
    });

    return response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId: eventId,
    });
  }

  async getUpcomingEvents(days: number = 7): Promise<calendar_v3.Schema$Event[]> {
    // Use KST timezone for upcoming events
    const now = new Date();
    const kstOffset = 9 * 60; // KST is UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);

    const startOfDay = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
      0, 0, 0, 0
    ));
    startOfDay.setHours(startOfDay.getHours() - 9); // Convert back to UTC

    const future = new Date(startOfDay.getTime() + days * 24 * 60 * 60 * 1000);

    return this.listEvents(startOfDay.toISOString(), future.toISOString(), 50);
  }

  async getTodayEvents(): Promise<calendar_v3.Schema$Event[]> {
    // Get current time in KST (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60; // KST is UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);

    // Set start of day in KST
    const startOfDay = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
      0, 0, 0, 0
    ));
    startOfDay.setHours(startOfDay.getHours() - 9); // Convert back to UTC

    // Set end of day in KST
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.listEvents(startOfDay.toISOString(), endOfDay.toISOString(), 50);
  }
}

// Singleton
let calendarInstance: GoogleCalendarClient | null = null;

export function getGoogleCalendarClient(): GoogleCalendarClient {
  if (!calendarInstance) {
    calendarInstance = new GoogleCalendarClient();
  }
  return calendarInstance;
}

export { GoogleCalendarClient };
