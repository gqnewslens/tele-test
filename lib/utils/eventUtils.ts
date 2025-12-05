/**
 * Event positioning and rendering utilities for calendar views
 */

import { getKSTDate, isSameDay, addDays } from './dateUtils';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  htmlLink?: string;
}

export interface EventPosition {
  top: number;
  height: number;
}

export interface EventLayout {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
  position: EventPosition;
}

export interface EventSegment {
  event: CalendarEvent;
  startDate: Date;
  endDate: Date;
  isStart: boolean;
  isEnd: boolean;
}

// Check if event is all-day
export function isAllDayEvent(event: CalendarEvent): boolean {
  return !!event.start.date && !event.start.dateTime;
}

// Get all-day events from a list
export function getAllDayEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(isAllDayEvent);
}

// Get timed events from a list
export function getTimedEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(e => !isAllDayEvent(e));
}

// Get event duration in minutes
export function getEventDuration(event: CalendarEvent): number {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr || !endStr) return 60; // Default 1 hour

  const start = new Date(startStr);
  const end = new Date(endStr);

  return (end.getTime() - start.getTime()) / (1000 * 60);
}

// Calculate event position in time grid
export function getEventPosition(
  event: CalendarEvent,
  startHour: number = 0,
  pixelsPerHour: number = 60
): EventPosition {
  const startStr = event.start.dateTime;
  if (!startStr) {
    return { top: 0, height: pixelsPerHour }; // Default for all-day
  }

  const startTime = new Date(startStr);
  const kstStart = new Date(startTime.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  const hours = kstStart.getHours();
  const minutes = kstStart.getMinutes();

  const startMinutes = (hours - startHour) * 60 + minutes;
  const durationMinutes = getEventDuration(event);

  const top = (startMinutes / 60) * pixelsPerHour;
  const height = Math.max((durationMinutes / 60) * pixelsPerHour, 20); // Min 20px

  return { top, height };
}

// Check if event occurs on a specific day
export function isEventInDay(event: CalendarEvent, date: Date): boolean {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr) return false;

  const eventStart = new Date(startStr);
  const eventEnd = endStr ? new Date(endStr) : eventStart;

  // Check if date falls within event range
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

// Check if event occurs in a specific week
export function isEventInWeek(event: CalendarEvent, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr) return false;

  const eventStart = new Date(startStr);
  const eventEnd = endStr ? new Date(endStr) : eventStart;

  return eventStart < weekEnd && eventEnd >= weekStart;
}

// Check if event is multi-day
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr || !endStr) return false;

  const start = new Date(startStr);
  const end = new Date(endStr);

  return !isSameDay(start, end);
}

// Get all days an event spans
export function getEventDays(event: CalendarEvent): Date[] {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr) return [];

  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;

  const days: Date[] = [];
  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  return days;
}

// Get event segments for week view (handle multi-day spanning)
export function getEventSegments(
  event: CalendarEvent,
  weekStart: Date,
  weekEnd: Date
): EventSegment[] {
  const startStr = event.start.dateTime || event.start.date;
  const endStr = event.end.dateTime || event.end.date;

  if (!startStr) return [];

  const eventStart = new Date(startStr);
  const eventEnd = endStr ? new Date(endStr) : eventStart;

  const segmentStart = eventStart >= weekStart ? eventStart : weekStart;
  const segmentEnd = eventEnd <= weekEnd ? eventEnd : weekEnd;

  const segments: EventSegment[] = [];
  const days = getEventDays(event);

  days.forEach((day, index) => {
    if (day >= weekStart && day < weekEnd) {
      segments.push({
        event,
        startDate: index === 0 ? eventStart : day,
        endDate: index === days.length - 1 ? eventEnd : addDays(day, 1),
        isStart: index === 0,
        isEnd: index === days.length - 1,
      });
    }
  });

  return segments;
}

// Detect overlapping events
export function getOverlappingEvents(
  events: CalendarEvent[],
  targetEvent: CalendarEvent
): CalendarEvent[] {
  const targetStart = new Date(targetEvent.start.dateTime || targetEvent.start.date || '');
  const targetEnd = new Date(targetEvent.end.dateTime || targetEvent.end.date || '');

  return events.filter(event => {
    if (event.id === targetEvent.id) return false;

    const eventStart = new Date(event.start.dateTime || event.start.date || '');
    const eventEnd = new Date(event.end.dateTime || event.end.date || '');

    // Check if time ranges overlap
    return eventStart < targetEnd && eventEnd > targetStart;
  });
}

// Calculate event layout columns for overlapping events
export function calculateEventColumns(events: CalendarEvent[]): EventLayout[] {
  if (events.length === 0) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = new Date(a.start.dateTime || a.start.date || '');
    const bStart = new Date(b.start.dateTime || b.start.date || '');
    return aStart.getTime() - bStart.getTime();
  });

  const layouts: EventLayout[] = [];
  const columns: CalendarEvent[][] = [];

  sortedEvents.forEach(event => {
    // Find the first column where this event doesn't overlap
    let columnIndex = 0;
    let placed = false;

    for (let i = 0; i < columns.length; i++) {
      const lastEventInColumn = columns[i][columns[i].length - 1];
      const lastEnd = new Date(lastEventInColumn.end.dateTime || lastEventInColumn.end.date || '');
      const currentStart = new Date(event.start.dateTime || event.start.date || '');

      if (currentStart >= lastEnd) {
        // No overlap, place in this column
        columns[i].push(event);
        columnIndex = i;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create new column
      columns.push([event]);
      columnIndex = columns.length - 1;
    }

    // Calculate total columns for overlapping group
    const overlapping = getOverlappingEvents(sortedEvents, event);
    const totalColumns = Math.max(
      overlapping.length + 1,
      columns.filter(col => col.some(e => overlapping.includes(e) || e.id === event.id)).length
    );

    layouts.push({
      event,
      column: columnIndex,
      totalColumns,
      position: getEventPosition(event),
    });
  });

  return layouts;
}

// Get event width based on column layout
export function getEventWidth(columnIndex: number, totalColumns: number): number {
  if (totalColumns === 1) return 100;
  return 100 / totalColumns;
}

// Get event left offset based on column
export function getEventLeft(columnIndex: number, totalColumns: number): number {
  if (totalColumns === 1) return 0;
  return (100 / totalColumns) * columnIndex;
}

// Format event time for display
export function formatEventTime(event: CalendarEvent): string {
  const startDate = event.start.dateTime || event.start.date;
  const endDate = event.end.dateTime || event.end.date;

  if (!startDate) return '';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (event.start.dateTime) {
    const kstStart = getKSTDate(start);
    const timeStr = kstStart.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    });

    if (end && event.end.dateTime) {
      const kstEnd = getKSTDate(end);
      const endTimeStr = kstEnd.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
      });
      return `${timeStr} - ${endTimeStr}`;
    }

    return timeStr;
  }

  // All-day event
  return '종일';
}

// Group events by date for month view
export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach(event => {
    const days = getEventDays(event);

    days.forEach(day => {
      const dateKey = day.toISOString().split('T')[0];
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, event]);
    });
  });

  // Sort events within each day by start time
  grouped.forEach((dayEvents, key) => {
    grouped.set(
      key,
      dayEvents.sort((a, b) => {
        const aStart = new Date(a.start.dateTime || a.start.date || '');
        const bStart = new Date(b.start.dateTime || b.start.date || '');
        return aStart.getTime() - bStart.getTime();
      })
    );
  });

  return grouped;
}
