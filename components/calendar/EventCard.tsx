'use client';

import { CalendarEvent, formatEventTime } from '@/lib/utils/eventUtils';

export type EventCardVariant = 'time-grid' | 'month' | 'all-day';

interface EventCardProps {
  event: CalendarEvent;
  variant: EventCardVariant;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function EventCard({ event, variant, style, onClick }: EventCardProps) {
  if (variant === 'month') {
    return (
      <div
        className="px-1.5 py-0.5 mb-0.5 text-xs rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors overflow-hidden"
        style={style}
        onClick={onClick}
        title={event.summary}
      >
        <div className="flex items-center gap-1 truncate">
          <span className="inline-block w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
          <span className="truncate">{event.summary}</span>
        </div>
      </div>
    );
  }

  if (variant === 'all-day') {
    return (
      <div
        className="px-3 py-1 text-sm rounded bg-blue-100 border-l-3 border-blue-500 cursor-pointer hover:bg-blue-200 transition-colors"
        style={style}
        onClick={onClick}
      >
        <div className="font-medium text-blue-900 truncate">{event.summary}</div>
      </div>
    );
  }

  // time-grid variant
  return (
    <div
      className="absolute px-2 py-1 text-xs rounded bg-blue-100 border-l-3 border-blue-500 cursor-pointer hover:bg-blue-200 transition-colors overflow-hidden"
      style={style}
      onClick={onClick}
    >
      <div className="font-medium text-blue-900 truncate">{event.summary}</div>
      <div className="text-gray-600 truncate">{formatEventTime(event)}</div>
      {event.location && (
        <div className="text-gray-500 truncate text-xs mt-0.5">
          📍 {event.location}
        </div>
      )}
    </div>
  );
}
