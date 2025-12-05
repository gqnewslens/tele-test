import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/calendar/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const calendar = getGoogleCalendarClient();
    const event = await calendar.getEvent(params.id);

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: event,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch event',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const calendar = getGoogleCalendarClient();

    const event = await calendar.updateEvent(params.id, body);

    return NextResponse.json({
      success: true,
      event: event,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const calendar = getGoogleCalendarClient();
    await calendar.deleteEvent(params.id);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      },
      { status: 500 }
    );
  }
}
