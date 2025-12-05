'use client';

import { formatMonthYear, formatWeekRange, formatDayDate } from '@/lib/utils/dateUtils';

export type ViewMode = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onRefresh: () => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onRefresh,
}: CalendarHeaderProps) {
  const getDateDisplay = () => {
    switch (viewMode) {
      case 'day':
        return formatDayDate(currentDate);
      case 'week':
        return formatWeekRange(currentDate);
      case 'month':
        return formatMonthYear(currentDate);
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNavigatePrev}
          className="px-3 py-1.5 text-gray-300 hover:bg-gray-700 rounded transition-colors"
          aria-label="이전"
        >
          ←
        </button>
        <button
          onClick={onNavigateToday}
          className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded transition-colors"
        >
          오늘
        </button>
        <button
          onClick={onNavigateNext}
          className="px-3 py-1.5 text-gray-300 hover:bg-gray-700 rounded transition-colors"
          aria-label="다음"
        >
          →
        </button>
      </div>

      {/* Date Display */}
      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold text-white">{getDateDisplay()}</h2>
      </div>

      {/* View Switcher & Refresh */}
      <div className="flex items-center gap-2">
        <div className="flex border border-gray-700 rounded overflow-hidden">
          <button
            onClick={() => onViewModeChange('day')}
            className={`px-4 py-1.5 text-sm transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            일
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-4 py-1.5 text-sm border-x border-gray-700 transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            주
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-4 py-1.5 text-sm transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            월
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-gray-300 hover:bg-gray-700 rounded transition-colors"
          aria-label="새로고침"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
