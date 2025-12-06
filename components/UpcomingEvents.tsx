'use client';

import { useEffect, useState } from 'react';
import { getKSTToday, addMonths } from '@/lib/utils/dateUtils';

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

export default function UpcomingEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const end = addMonths(now, 1);

      const res = await fetch(
        `/api/calendar/events?start=${now.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();

      if (data.success) {
        // Sort by start time and take only 3
        const sortedEvents = (data.events as CalendarEvent[])
          .sort((a, b) => {
            const aStart = new Date(a.start.dateTime || a.start.date || '');
            const bStart = new Date(b.start.dateTime || b.start.date || '');
            return aStart.getTime() - bStart.getTime();
          })
          .slice(0, 3);

        setEvents(sortedEvents);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('[UpcomingEvents] Error:', err);
      setError('일정을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const startStr = event.start.dateTime || event.start.date;
    if (!startStr) return '';

    const start = new Date(startStr);

    if (event.start.date && !event.start.dateTime) {
      // All-day event
      return start.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }) + ' 종일';
    }

    // Timed event
    const today = getKSTToday();
    const isToday = start.toDateString() === today.toDateString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = start.toDateString() === tomorrow.toDateString();

    const timeStr = start.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    });

    if (isToday) {
      return `오늘 ${timeStr}`;
    } else if (isTomorrow) {
      return `내일 ${timeStr}`;
    } else {
      return start.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }) + ' ' + timeStr;
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.htmlLink) {
      window.open(event.htmlLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 h-[300px]">
        <div className="text-center text-slate-400 py-8">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 h-[300px]">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 h-[300px] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-cyan-400">이 시간 주요일정</h2>
        <a
          href="/calendar"
          className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          전체 보기 →
        </a>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          예정된 일정이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-cyan-600/50 cursor-pointer transition-all hover:bg-slate-700/70"
            >
              <div className="flex items-start gap-3">
                <div className="text-cyan-400 text-lg">📅</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-200 truncate">
                    {event.summary}
                  </h3>
                  <p className="text-sm text-cyan-400 mt-1">
                    {formatEventTime(event)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      📍 {event.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
