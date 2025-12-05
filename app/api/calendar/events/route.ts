import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/calendar/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const type = searchParams.get('type') || 'upcoming';

    const calendar = getGoogleCalendarClient();

    let events;
    if (type === 'today') {
      events = await calendar.getTodayEvents();
    } else {
      events = await calendar.getUpcomingEvents(days);
    }

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, description, start, end, location, attendees } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const calendar = getGoogleCalendarClient();
    const event = await calendar.createEvent({
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: end,
        timeZone: 'Asia/Seoul',
      },
      location,
      attendees,
    });

    return NextResponse.json({
      success: true,
      event: event,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      },
      { status: 500 }
    );
  }
}
