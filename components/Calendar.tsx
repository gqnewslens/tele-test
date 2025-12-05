'use client';

import { useEffect, useState } from 'react';

interface CalendarEvent {
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

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'today' | 'week'>('today');

  useEffect(() => {
    fetchEvents();
  }, [viewType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const days = viewType === 'today' ? 1 : 7;
      const res = await fetch(`/api/calendar/events?type=${viewType}&days=${days}`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('캘린더를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const startDate = event.start.dateTime || event.start.date;
    const endDate = event.end.dateTime || event.end.date;

    if (!startDate) return '';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const dateStr = start.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });

    if (event.start.dateTime) {
      const timeStr = start.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endTimeStr = end?.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return `${dateStr} ${timeStr}${endTimeStr ? ` - ${endTimeStr}` : ''}`;
    }

    return dateStr;
  };

  const isEventToday = (event: CalendarEvent) => {
    const eventDate = new Date(event.start.dateTime || event.start.date || '');
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📅 캘린더</h2>
        </div>
        <div className="text-center text-gray-400 py-8">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📅 캘린더</h2>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📅 캘린더</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('today')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewType === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewType === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            이번 주
          </button>
          <button
            onClick={fetchEvents}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          {viewType === 'today' ? '오늘 일정이 없습니다' : '이번 주 일정이 없습니다'}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg p-4 border transition-colors ${
                isEventToday(event)
                  ? 'bg-blue-900/30 border-blue-700'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1">{event.summary}</h3>
                  <p className="text-sm text-gray-400 mb-2">{formatEventTime(event)}</p>
                  {event.description && (
                    <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      📍 {event.location}
                    </p>
                  )}
                </div>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    상세보기 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
