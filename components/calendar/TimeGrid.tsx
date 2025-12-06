'use client';

import { useLayoutEffect, useRef } from 'react';
import { generateTimeSlots } from '@/lib/utils/dateUtils';

interface TimeGridProps {
  startHour?: number;
  endHour?: number;
  pixelsPerHour?: number;
  children?: React.ReactNode;
  onTimeSlotClick?: (hour: number) => void;
}

export default function TimeGrid({
  startHour = 0,
  endHour = 24,
  pixelsPerHour = 60,
  children,
  onTimeSlotClick,
}: TimeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeSlots = generateTimeSlots(startHour, endHour, 60);
  const totalHeight = (endHour - startHour) * pixelsPerHour;

  // Use useLayoutEffect to scroll before paint, preventing flash
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 7 * pixelsPerHour;
    }
  }, [pixelsPerHour]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="flex" style={{ height: `${totalHeight}px` }}>
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-gray-700">
          {timeSlots.map((slot, index) => (
            <div
              key={slot}
              className="text-right pr-2 text-gray-500 text-xs"
              style={{ height: `${pixelsPerHour}px` }}
            >
              {index === 0 ? '' : slot}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 relative">
          {/* Grid lines - background layer */}
          {timeSlots.map((slot, index) => (
            <div
              key={`line-${slot}`}
              className="absolute left-0 right-0 border-t border-gray-700/50"
              style={{
                top: `${index * pixelsPerHour}px`,
                height: `${pixelsPerHour}px`,
              }}
              onClick={() => onTimeSlotClick?.(startHour + index)}
            >
              {/* Half-hour guide line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-gray-700/30"
                style={{ top: `${pixelsPerHour / 2}px` }}
              ></div>
            </div>
          ))}

          {/* Events rendered here - on top of grid lines */}
          {children}
        </div>
      </div>
    </div>
  );
}
