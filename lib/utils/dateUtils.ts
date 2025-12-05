/**
 * Date utility functions for calendar views
 * All functions handle KST (Korea Standard Time, UTC+9) timezone
 */

// KST timezone utilities
export function getKSTDate(date?: Date): Date {
  const d = date || new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  return new Date(d.getTime() + kstOffset * 60 * 1000);
}

export function getKSTToday(): Date {
  const now = new Date();
  const kstNow = getKSTDate(now);
  return new Date(Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
    0, 0, 0, 0
  ));
}

export function getStartOfDay(date: Date, tz: 'KST' | 'UTC' = 'KST'): Date {
  if (tz === 'KST') {
    const kstDate = getKSTDate(date);
    const start = new Date(Date.UTC(
      kstDate.getUTCFullYear(),
      kstDate.getUTCMonth(),
      kstDate.getUTCDate(),
      0, 0, 0, 0
    ));
    start.setHours(start.getHours() - 9); // Convert back to UTC
    return start;
  } else {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
  }
}

export function getEndOfDay(date: Date, tz: 'KST' | 'UTC' = 'KST'): Date {
  const start = getStartOfDay(date, tz);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

// Week calculations (week starts on Sunday for Korea)
export function getWeekStart(date: Date, startOnMonday: boolean = false): Date {
  const kstDate = getKSTDate(date);
  const day = kstDate.getUTCDay();
  const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day;

  const weekStart = new Date(Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    kstDate.getUTCDate() + diff,
    0, 0, 0, 0
  ));
  weekStart.setHours(weekStart.getHours() - 9); // Convert back to UTC
  return weekStart;
}

export function getWeekDays(date: Date, startOnMonday: boolean = false): Date[] {
  const weekStart = getWeekStart(date, startOnMonday);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    days.push(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  const kst1 = getKSTDate(date1);
  const kst2 = getKSTDate(date2);

  return (
    kst1.getUTCDate() === kst2.getUTCDate() &&
    kst1.getUTCMonth() === kst2.getUTCMonth() &&
    kst1.getUTCFullYear() === kst2.getUTCFullYear()
  );
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return isSameDay(week1Start, week2Start);
}

// Month calculations
export function getMonthStart(date: Date): Date {
  const kstDate = getKSTDate(date);
  const monthStart = new Date(Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    1,
    0, 0, 0, 0
  ));
  monthStart.setHours(monthStart.getHours() - 9); // Convert back to UTC
  return monthStart;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  firstDay.setHours(firstDay.getHours() - 9); // Convert to UTC

  const kstFirstDay = getKSTDate(firstDay);
  const firstDayOfWeek = kstFirstDay.getUTCDay(); // 0 = Sunday

  // Start from the Sunday before or on the first day
  const calendarStart = new Date(firstDay.getTime() - firstDayOfWeek * 24 * 60 * 60 * 1000);

  const weeks: Date[][] = [];
  let currentDate = new Date(calendarStart);

  // Generate 6 weeks to ensure we cover all days
  for (let week = 0; week < 6; week++) {
    const weekDays: Date[] = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(currentDate));
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
    weeks.push(weekDays);
  }

  return weeks;
}

export function getMonthDays(year: number, month: number): Date[][] {
  return getCalendarWeeks(year, month);
}

// Time slot generation
export function generateTimeSlots(
  startHour: number = 0,
  endHour: number = 24,
  interval: number = 60
): string[] {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      slots.push(formatTimeSlot(hour, minute));
    }
  }

  return slots;
}

export function formatTimeSlot(hour: number, minute: number = 0): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getTimeSlotPosition(
  time: Date,
  startHour: number = 0,
  pixelsPerHour: number = 60
): number {
  const kstTime = getKSTDate(time);
  const hours = kstTime.getUTCHours();
  const minutes = kstTime.getUTCMinutes();

  const totalMinutes = (hours - startHour) * 60 + minutes;
  return (totalMinutes / 60) * pixelsPerHour;
}

// Date arithmetic helpers
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const kstDate = getKSTDate(date);
  const newDate = new Date(Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth() + months,
    kstDate.getUTCDate(),
    0, 0, 0, 0
  ));
  newDate.setHours(newDate.getHours() - 9);
  return newDate;
}

// Format helpers for display
export function formatMonthYear(date: Date): string {
  const kstDate = getKSTDate(date);
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
  });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const kstStart = getKSTDate(weekStart);
  const kstEnd = getKSTDate(weekEnd);

  const startStr = kstStart.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });

  const endStr = kstEnd.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });

  return `${startStr} - ${endStr}`;
}

export function formatDayDate(date: Date): string {
  const kstDate = getKSTDate(date);
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });
}
