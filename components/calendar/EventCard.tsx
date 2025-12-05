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
        className="px-2 py-0.5 mb-1 text-xs rounded bg-blue-900/30 text-blue-200 truncate cursor-pointer hover:bg-blue-900/40 transition-colors"
        style={style}
        onClick={onClick}
        title={event.summary}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
        {event.summary}
      </div>
    );
  }

  if (variant === 'all-day') {
    return (
      <div
        className="px-3 py-1 text-sm rounded bg-blue-900/30 border-l-3 border-blue-500 cursor-pointer hover:bg-blue-900/40 transition-colors"
        style={style}
        onClick={onClick}
      >
        <div className="font-medium text-white truncate">{event.summary}</div>
      </div>
    );
  }

  // time-grid variant
  return (
    <div
      className="absolute px-2 py-1 text-xs rounded bg-blue-900/30 border-l-3 border-blue-500 cursor-pointer hover:bg-blue-900/40 transition-colors overflow-hidden"
      style={style}
      onClick={onClick}
    >
      <div className="font-medium text-white truncate">{event.summary}</div>
      <div className="text-gray-400 truncate">{formatEventTime(event)}</div>
      {event.location && (
        <div className="text-gray-500 truncate text-xs mt-0.5">
          📍 {event.location}
        </div>
      )}
    </div>
  );
}
