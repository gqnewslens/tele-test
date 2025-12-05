'use client';

import { useState } from 'react';
import EventCard from './EventCard';
import {
  CalendarEvent,
  groupEventsByDate,
  isEventInDay,
} from '@/lib/utils/eventUtils';
import { getCalendarWeeks, isSameDay, getKSTToday, getKSTDate, getMonthStart } from '@/lib/utils/dateUtils';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export default function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const today = getKSTToday();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const weeks = getCalendarWeeks(currentYear, currentMonth);
  const eventsByDate = groupEventsByDate(events);

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="flex flex-col h-[600px]">
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-gray-700">
        {dayNames.map((name, index) => (
          <div
            key={name}
            className={`text-center py-2 text-sm font-medium ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-5 md:grid-rows-6 border-l border-gray-700 overflow-y-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((date, dayIndex) => {
              const dateKey = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isToday = isSameDay(date, today);
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isExpanded = expandedDate === dateKey;

              const visibleEvents = isExpanded
                ? dayEvents
                : dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const hiddenCount = Math.max(0, dayEvents.length - MAX_VISIBLE_EVENTS);

              return (
                <div
                  key={dateKey}
                  className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-r border-b border-gray-700 ${
                    isToday ? 'bg-blue-900/10 border-blue-500 border-2' : ''
                  } ${!isCurrentMonth ? 'bg-gray-900/50' : ''}`}
                >
                  {/* Date number */}
                  <div
                    className={`text-sm mb-1 ${
                      isToday
                        ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-semibold'
                        : isCurrentMonth
                        ? 'text-white font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {visibleEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="month"
                        onClick={() => onEventClick?.(event)}
                      />
                    ))}

                    {/* Show more button */}
                    {!isExpanded && hiddenCount > 0 && (
                      <button
                        onClick={() => setExpandedDate(dateKey)}
                        className="w-full px-2 py-0.5 text-xs text-blue-400 hover:text-blue-300 text-left"
                      >
                        +{hiddenCount}개 더보기
                      </button>
                    )}

                    {/* Show less button */}
                    {isExpanded && dayEvents.length > MAX_VISIBLE_EVENTS && (
                      <button
                        onClick={() => setExpandedDate(null)}
                        className="w-full px-2 py-0.5 text-xs text-blue-400 hover:text-blue-300 text-left"
                      >
                        줄이기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
