'use client';

import { useEffect, useState } from 'react';
import CalendarHeader, { ViewMode } from './calendar/CalendarHeader';
import DayView from './calendar/DayView';
import WeekView from './calendar/WeekView';
import MonthView from './calendar/MonthView';
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

export default function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(getKSTToday());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventsForView();
  }, [currentDate, viewMode]);

  const fetchEventsForView = async () => {
    try {
      // Only show loading on initial load, not on view mode changes
      if (events.length === 0) {
        setLoading(true);
      }
      const { start, end } = getDateRangeForView();

      console.log('[Calendar] Fetching events:', { viewMode, start: start.toISOString(), end: end.toISOString() });

      const res = await fetch(
        `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();

      console.log('[Calendar] API response:', { success: data.success, eventCount: data.events?.length, events: data.events });

      if (data.success) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('[Calendar] Fetch error:', err);
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
        // Add extra days to cover full calendar grid (6 weeks)
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
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        onNavigateToday={handleNavigateToday}
        onRefresh={fetchEventsForView}
      />

      {/* Render appropriate view */}
      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}

      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
        />
      )}
    </div>
  );
}
