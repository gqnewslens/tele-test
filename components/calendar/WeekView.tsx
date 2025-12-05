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
  isMultiDayEvent,
} from '@/lib/utils/eventUtils';
import { getWeekDays, isSameDay, getKSTToday, getKSTDate } from '@/lib/utils/dateUtils';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const PIXELS_PER_HOUR = 60;

export default function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate, false); // Sunday start
  const today = getKSTToday();
  const isCurrentWeek = weekDays.some(day => isSameDay(day, today));

  // Get all-day events
  const allDayEvents = getAllDayEvents(events);

  return (
    <div className="flex flex-col h-[600px]">
      {/* Week header */}
      <div className="flex border-b border-gray-700">
        {/* Empty cell for time column */}
        <div className="w-16 flex-shrink-0 border-r border-gray-700"></div>

        {/* Day headers */}
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
          const dayName = ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek];
          const dayDate = day.getDate();

          return (
            <div
              key={day.toISOString()}
              className={`flex-1 text-center py-2 border-r border-gray-700 ${
                isToday ? 'bg-blue-900/20' : ''
              }`}
            >
              <div className="text-xs text-gray-500">{dayName}</div>
              <div
                className={`text-sm font-medium ${
                  isToday ? 'text-blue-400' : 'text-white'
                }`}
              >
                {dayDate}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          {/* Label */}
          <div className="w-16 flex-shrink-0 border-r border-gray-700 p-2">
            <div className="text-xs text-gray-500">종일</div>
          </div>

          {/* All-day event cells */}
          {weekDays.map(day => {
            const dayAllDayEvents = allDayEvents.filter(event =>
              isEventInDay(event, day)
            );

            return (
              <div
                key={`allday-${day.toISOString()}`}
                className="flex-1 p-2 border-r border-gray-700"
              >
                <div className="space-y-1">
                  {dayAllDayEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="all-day"
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid with columns */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-gray-700">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="text-right pr-2 text-gray-500 text-xs"
                style={{ height: `${PIXELS_PER_HOUR}px` }}
              >
                {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const dayTimedEvents = getTimedEvents(events).filter(event =>
              isEventInDay(event, day)
            );
            const eventLayouts = calculateEventColumns(dayTimedEvents);

            return (
              <div
                key={day.toISOString()}
                className={`flex-1 relative border-r border-gray-700 ${
                  isToday ? 'bg-blue-900/10' : ''
                }`}
              >
                {/* Grid lines */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    className="border-t border-gray-700/50"
                    style={{ height: `${PIXELS_PER_HOUR}px`, position: 'relative' }}
                  >
                    {/* Half-hour guide line */}
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-gray-700/30"
                      style={{ top: `${PIXELS_PER_HOUR / 2}px` }}
                    ></div>
                  </div>
                ))}

                {/* Current time indicator */}
                {isToday && <CurrentTimeIndicator pixelsPerHour={PIXELS_PER_HOUR} />}

                {/* Events */}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
