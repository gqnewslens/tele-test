'use client';

import TimeGrid from './TimeGrid';
import EventCard from './EventCard';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import {
  CalendarEvent,
  getTimedEvents,
  getAllDayEvents,
  isEventInDay,
  getEventPosition,
  calculateEventColumns,
  getEventWidth,
  getEventLeft,
} from '@/lib/utils/eventUtils';
import { isSameDay, getKSTToday } from '@/lib/utils/dateUtils';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  fullHeight?: boolean;
}

const PIXELS_PER_HOUR = 60;

export default function DayView({ currentDate, events, onEventClick, fullHeight = false }: DayViewProps) {
  const isToday = isSameDay(currentDate, getKSTToday());

  // Filter events for this specific day (in case we receive events from a wider range)
  const dayEvents = events.filter(event => isEventInDay(event, currentDate));
  const allDayEvents = getAllDayEvents(dayEvents);
  const timedEvents = getTimedEvents(dayEvents);

  // Calculate layouts for overlapping events
  const eventLayouts = calculateEventColumns(timedEvents);

  console.log('[DayView] Rendering:', {
    totalEvents: events.length,
    dayEvents: dayEvents.length,
    allDayCount: allDayEvents.length,
    timedCount: timedEvents.length,
    layoutsCount: eventLayouts.length,
    currentDate: currentDate.toISOString()
  });

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-full' : 'h-[600px]'}`}>
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">종일</div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                variant="all-day"
                onClick={() => onEventClick?.(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <TimeGrid pixelsPerHour={PIXELS_PER_HOUR}>
        {/* Current time indicator */}
        {isToday && <CurrentTimeIndicator pixelsPerHour={PIXELS_PER_HOUR} />}

        {/* Timed events */}
        {eventLayouts.map(({ event, column, totalColumns, position }) => {
          const width = getEventWidth(column, totalColumns);
          const left = getEventLeft(column, totalColumns);

          return (
            <EventCard
              key={event.id}
              event={event}
              variant="time-grid"
              style={{
                top: `${position.top}px`,
                height: `${position.height}px`,
                left: `${left}%`,
                width: `${width}%`,
              }}
              onClick={() => onEventClick?.(event)}
            />
          );
        })}
      </TimeGrid>
    </div>
  );
}
