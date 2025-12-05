'use client';

import { useEffect, useState } from 'react';
import { getTimeSlotPosition } from '@/lib/utils/dateUtils';

interface CurrentTimeIndicatorProps {
  pixelsPerHour?: number;
}

export default function CurrentTimeIndicator({ pixelsPerHour = 60 }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const position = getTimeSlotPosition(currentTime, 0, pixelsPerHour);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1"></div>
        <div className="flex-1 h-0.5 bg-red-500"></div>
      </div>
    </div>
  );
}
