'use client';

import { useEffect, useState } from 'react';
import CalendarHeader, { ViewMode } from '@/components/calendar/CalendarHeader';
import DayView from '@/components/calendar/DayView';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import {
  getKSTToday,
  addDays,
  addWeeks,
  addMonths,
  getStartOfDay,
  getEndOfDay,
  getWeekStart,
  getMonthStart,
} from '@/lib/utils/dateUtils';

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

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(getKSTToday());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the last fetched range to avoid unnecessary refetches
  const [fetchedRange, setFetchedRange] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    // Always fetch a week's worth of data, regardless of view mode
    // This ensures we have enough data when switching between views
    fetchEventsForView();
  }, [currentDate]);

  const fetchEventsForView = async () => {
    try {
      // Only show loading on initial load
      if (events.length === 0) {
        setLoading(true);
      }

      // Always fetch at least a week's worth of data
      const weekStart = getWeekStart(currentDate, false);
      const start = viewMode === 'month'
        ? new Date(getMonthStart(currentDate).getTime() - 7 * 24 * 60 * 60 * 1000)
        : weekStart;
      const end = viewMode === 'month'
        ? new Date(addMonths(getMonthStart(currentDate), 1).getTime() + 14 * 24 * 60 * 60 * 1000)
        : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Skip fetch if we already have data for this range
      if (fetchedRange &&
          start >= fetchedRange.start &&
          end <= fetchedRange.end) {
        console.log('[CalendarPage] Using cached data');
        return;
      }

      console.log('[CalendarPage] Fetching:', { viewMode, start: start.toISOString(), end: end.toISOString() });

      const res = await fetch(
        `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();

      console.log('[CalendarPage] Response:', { success: data.success, count: data.events?.length });

      if (data.success) {
        setEvents(data.events);
        setFetchedRange({ start, end });
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('[CalendarPage] Error:', err);
      setError('캘린더를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForView = () => {
    switch (viewMode) {
      case 'day':
        return {
          start: getStartOfDay(currentDate),
          end: getEndOfDay(currentDate),
        };
      case 'week': {
        const weekStart = getWeekStart(currentDate, false);
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      }
      case 'month': {
        const monthStart = getMonthStart(currentDate);
        const monthEnd = addMonths(monthStart, 1);
        return {
          start: new Date(monthStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(monthEnd.getTime() + 14 * 24 * 60 * 60 * 1000),
        };
      }
      default:
        return {
          start: getStartOfDay(currentDate),
          end: getEndOfDay(currentDate),
        };
    }
  };

  const handleNavigatePrev = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return addDays(prev, -1);
        case 'week':
          return addWeeks(prev, -1);
        case 'month':
          return addMonths(prev, -1);
        default:
          return prev;
      }
    });
  };

  const handleNavigateNext = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return addDays(prev, 1);
        case 'week':
          return addWeeks(prev, 1);
        case 'month':
          return addMonths(prev, 1);
        default:
          return prev;
      }
    });
  };

  const handleNavigateToday = () => {
    setCurrentDate(getKSTToday());
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.htmlLink) {
      window.open(event.htmlLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
            <div className="text-center text-cyan-400 py-12">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-cyan-400">일정</h1>
          <p className="text-slate-400 mt-1">Google Calendar 일정을 확인하세요</p>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            onNavigateToday={handleNavigateToday}
            onRefresh={fetchEventsForView}
          />

          <div className="mt-4" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                fullHeight
              />
            )}

            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                fullHeight
              />
            )}

            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                fullHeight
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
