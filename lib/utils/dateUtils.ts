/**
 * Date utility functions for calendar views
 * All functions handle KST (Korea Standard Time, UTC+9) timezone
 */

// KST timezone utilities
export function getKSTDate(date?: Date): Date {
  const d = date || new Date();
  // Convert to KST by using toLocaleString with Asia/Seoul timezone
  const kstString = d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  return new Date(kstString);
}

export function getKSTToday(): Date {
  const now = new Date();
  const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  return new Date(
    kstNow.getFullYear(),
    kstNow.getMonth(),
    kstNow.getDate(),
    0, 0, 0, 0
  );
}

export function getStartOfDay(date: Date, tz: 'KST' | 'UTC' = 'KST'): Date {
  if (tz === 'KST') {
    const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const year = kstDate.getFullYear();
    const month = kstDate.getMonth();
    const day = kstDate.getDate();

    // Create start of day in KST, then convert to UTC
    const kstStart = new Date(year, month, day, 0, 0, 0, 0);
    const utcStart = new Date(kstStart.toLocaleString('en-US', { timeZone: 'UTC' }));

    // Adjust for timezone offset
    return new Date(date.getTime() - (date.getTime() % (24 * 60 * 60 * 1000)) - (9 * 60 * 60 * 1000));
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
  const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const day = kstDate.getDay(); // 0 = Sunday, 6 = Saturday
  const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day;

  const weekStartKST = new Date(
    kstDate.getFullYear(),
    kstDate.getMonth(),
    kstDate.getDate() + diff,
    0, 0, 0, 0
  );

  return weekStartKST;
}

export function getWeekDays(date: Date, startOnMonday: boolean = false): Date[] {
  const weekStart = getWeekStart(date, startOnMonday);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  const kst1 = new Date(date1.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const kst2 = new Date(date2.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  return (
    kst1.getDate() === kst2.getDate() &&
    kst1.getMonth() === kst2.getMonth() &&
    kst1.getFullYear() === kst2.getFullYear()
  );
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return isSameDay(week1Start, week2Start);
}

// Month calculations
export function getMonthStart(date: Date): Date {
  const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return new Date(kstDate.getFullYear(), kstDate.getMonth(), 1, 0, 0, 0, 0);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1, 0, 0, 0, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Start from the Sunday before or on the first day
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDayOfWeek);

  const weeks: Date[][] = [];
  let currentDate = new Date(calendarStart);

  // Generate 6 weeks to ensure we cover all days
  for (let week = 0; week < 6; week++) {
    const weekDays: Date[] = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
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
  const kstTime = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const hours = kstTime.getHours();
  const minutes = kstTime.getMinutes();

  const totalMinutes = (hours - startHour) * 60 + minutes;
  return (totalMinutes / 60) * pixelsPerHour;
}

// Date arithmetic helpers
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Format helpers for display
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
  });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);

  const startStr = weekStart.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });

  const endStr = weekEnd.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });

  return `${startStr} - ${endStr}`;
}

export function formatDayDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  });
}
