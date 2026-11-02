'use client';

import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfToday,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarDateRange {
  startDate: string;
  endDate: string;
  type: 'booked' | 'blocked';
}

interface AvailabilityCalendarProps {
  ranges: CalendarDateRange[];
  selectedStart?: string;
  selectedEnd?: string;
  onSelectRange?: (start: string, end: string) => void;
}

export function AvailabilityCalendar({
  ranges,
  selectedStart,
  selectedEnd,
  onSelectRange,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate day-of-week offset for the 1st of the month
  const startDayIndex = monthStart.getDay(); // 0 is Sunday

  // Helper to check if a day is disabled (booked or blocked)
  const isDateUnavailable = (date: Date) => {
    if (isBefore(date, today)) return true; // Past days
    const dateStr = format(date, 'yyyy-MM-dd');

    return ranges.some((range) => {
      return dateStr >= range.startDate && dateStr <= range.endDate;
    });
  };

  const isDateSelected = (date: Date) => {
    if (!selectedStart) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (selectedEnd) {
      return dateStr >= selectedStart && dateStr <= selectedEnd;
    }
    return dateStr === selectedStart;
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#F0DFC8] shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-base text-[#3B2216]">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isSameMonth(currentMonth, today)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FAF0E4] disabled:opacity-30 disabled:cursor-not-allowed text-[#3B2216] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FAF0E4] text-[#3B2216] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="text-[11px] font-bold uppercase text-[#735340]">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty padding days */}
        {Array.from({ length: startDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {daysInMonth.map((day) => {
          const unavailable = isDateUnavailable(day);
          const selected = isDateSelected(day);
          const currentDayIsToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`h-10 rounded-xl flex items-center justify-center text-xs font-semibold select-none transition-all ${
                unavailable
                  ? 'bg-[#FAF0E4]/60 text-[#735340]/40 line-through cursor-not-allowed'
                  : selected
                  ? 'bg-[#E8772E] text-white shadow-sm'
                  : 'bg-[#FFFBF5] text-[#3B2216] hover:bg-[#1AA3A3]/15 cursor-pointer'
              } ${currentDayIsToday && !selected ? 'border-2 border-[#1AA3A3]' : ''}`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#F0DFC8]/60 flex items-center justify-around text-[11px] font-medium text-[#735340]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FFFBF5] border border-[#F0DFC8]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FAF0E4] line-through text-[#735340]/50" />
          <span>Booked / Held</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E8772E]" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
