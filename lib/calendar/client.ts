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
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return this.listEvents(now.toISOString(), future.toISOString(), 50);
  }

  async getTodayEvents(): Promise<calendar_v3.Schema$Event[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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
