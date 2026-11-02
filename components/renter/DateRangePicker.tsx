'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfToday,
  differenceInCalendarDays,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

export interface DisabledDateRange {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  reason?: string;
}

export interface DateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  onChange: (startDate: string, endDate: string) => void;
  disabledRanges?: DisabledDateRange[];
  className?: string;
  pickupLabel?: string;
  returnLabel?: string;
  align?: 'left' | 'right';
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  disabledRanges = [],
  className = '',
  pickupLabel = 'Pickup Date',
  returnLabel = 'Return Date',
  align = 'left',
}: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Popover open state and active selection target ('start' | 'end')
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');

  // In-progress date selections
  const [tempStart, setTempStart] = useState<string>(startDate || '');
  const [tempEnd, setTempEnd] = useState<string>(endDate || '');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Month navigation (base month is the left month on desktop)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (startDate) {
      try {
        return startOfMonth(parseISO(startDate));
      } catch {
        return startOfMonth(today);
      }
    }
    return startOfMonth(today);
  });

  // Inline conflict alert
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Sync internal state when props change externally (e.g. from URL searchParams)
  useEffect(() => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
    if (startDate) {
      try {
        setCurrentMonth(startOfMonth(parseISO(startDate)));
      } catch {
        // ignore
      }
    }
  }, [startDate, endDate]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setConflictMessage(null);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setConflictMessage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Check if a date string is in the past
  const isDateInPast = (dateStr: string) => dateStr < todayStr;

  // Check if a date is explicitly disabled by booked or blocked ranges
  const isDateDisabled = (dateStr: string): { disabled: boolean; reason?: string } => {
    if (isDateInPast(dateStr)) return { disabled: true };

    for (const range of disabledRanges) {
      if (dateStr >= range.startDate && dateStr <= range.endDate) {
        return { disabled: true, reason: range.reason };
      }
    }
    return { disabled: false };
  };

  // Check if any disabled date exists strictly inside or on the boundaries of [start, end]
  const doesRangeSpanDisabled = (start: string, end: string): string | null => {
    for (const range of disabledRanges) {
      if (start <= range.endDate && end >= range.startDate) {
        try {
          const s = format(parseISO(range.startDate), 'MMM d');
          const e = format(parseISO(range.endDate), 'MMM d');
          return `${s} – ${e}`;
        } catch {
          return `${range.startDate} – ${range.endDate}`;
        }
      }
    }
    return null;
  };

  // Date cell click handler
  const handleDateClick = (dateStr: string) => {
    const { disabled } = isDateDisabled(dateStr);
    if (disabled) return;

    setConflictMessage(null);

    // If starting a fresh selection, or active target is 'start', or range is already completed
    if (activeTarget === 'start' || (!tempStart && !tempEnd) || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
      setActiveTarget('end');
      return;
    }

    // Active target is 'end' and tempStart exists:
    if (activeTarget === 'end' && tempStart) {
      // If clicked date is earlier than pickup date, treat as new pickup date
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd('');
        setActiveTarget('end');
        return;
      }

      // Check if range spans any disabled booked/blocked days
      const spanConflict = doesRangeSpanDisabled(tempStart, dateStr);
      if (spanConflict) {
        setConflictMessage(`Not available on ${spanConflict}. Please choose an open window.`);
        return;
      }

      // Valid range selected! Close popover automatically.
      setTempEnd(dateStr);
      onChange(tempStart, dateStr);
      setIsOpen(false);
      setConflictMessage(null);
    }
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    setHoveredDate(null);
    setActiveTarget('start');
    setConflictMessage(null);
    onChange('', '');
  };

  const handleDone = () => {
    if (tempStart && tempEnd) {
      onChange(tempStart, tempEnd);
      setIsOpen(false);
      setConflictMessage(null);
    }
  };

  const openFor = (target: 'start' | 'end') => {
    setActiveTarget(target);
    setIsOpen(true);
    setConflictMessage(null);
  };

  // Format date display for trigger boxes ("Tue, Nov 3")
  const formatInputDisplay = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return format(d, 'EEE, MMM d');
    } catch {
      return dateStr;
    }
  };

  // Rental duration calculation
  const getSelectedDaysCount = () => {
    if (!tempStart || !tempEnd) return 0;
    try {
      const s = parseISO(tempStart);
      const e = parseISO(tempEnd);
      const diff = differenceInCalendarDays(e, s);
      return Math.max(1, diff + 1);
    } catch {
      return 1;
    }
  };

  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));

  // Determine if a day is part of the selected or previewed range
  const getDayRangeStatus = (dateStr: string) => {
    if (tempStart && tempEnd) {
      const isStart = dateStr === tempStart;
      const isEnd = dateStr === tempEnd;
      const isBetween = dateStr > tempStart && dateStr < tempEnd;
      return { isStart, isEnd, isBetween, isSingleDay: tempStart === tempEnd && isStart };
    }

    if (tempStart && !tempEnd && hoveredDate && hoveredDate >= tempStart) {
      const isStart = dateStr === tempStart;
      const isEnd = dateStr === hoveredDate;
      const isBetween = dateStr > tempStart && dateStr < hoveredDate;
      return { isStart, isEnd, isBetween, isSingleDay: tempStart === hoveredDate && isStart };
    }

    if (tempStart && dateStr === tempStart) {
      return { isStart: true, isEnd: false, isBetween: false, isSingleDay: false };
    }

    return { isStart: false, isEnd: false, isBetween: false, isSingleDay: false };
  };

  // Month grid renderer with fixed 280px width
  const renderMonth = (monthDate: Date, isFirstMonth: boolean) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayIndex = monthStart.getDay(); // 0 is Sunday
    const isPrevDisabled = isBefore(monthStart, today) && isSameDay(monthStart, startOfMonth(today));

    return (
      <div className="w-[280px] shrink-0 flex flex-col items-center select-none">
        {/* Month Header: prev and next arrows vertically aligned with month title */}
        <div className="flex items-center justify-between w-full h-10 mb-2 px-1">
          {isFirstMonth ? (
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevDisabled}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1AA3A3] hover:bg-[#FAF0E4] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9" aria-hidden="true" />
          )}

          <h4 className="font-bold text-sm text-[#3B2216]">
            {format(monthDate, 'MMMM yyyy')}
          </h4>

          {isFirstMonth ? (
            <button
              type="button"
              onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1AA3A3] hover:bg-[#FAF0E4] transition-colors md:invisible cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1AA3A3] hover:bg-[#FAF0E4] transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Weekday column headers: exact 40px width per column */}
        <div className="grid grid-cols-7 w-full mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="h-7 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#735340]/70 uppercase">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Day cells grid: exact 40px width per column */}
        <div className="grid grid-cols-7 gap-y-1 w-full">
          {Array.from({ length: startDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const { disabled } = isDateDisabled(dateStr);
            const isTodayDate = isSameDay(day, today);
            const { isStart, isEnd, isBetween, isSingleDay } = getDayRangeStatus(dateStr);

            return (
              <div
                key={dateStr}
                className="relative h-10 flex items-center justify-center"
              >
                {/* Absolute background strip: never alters button dimensions or cell layout */}
                {isBetween && (
                  <div className="absolute inset-y-0 inset-x-0 bg-[#FFE3CC]" />
                )}
                {isStart && !isSingleDay && (tempEnd || hoveredDate) && (
                  <div className="absolute inset-y-0 left-0 right-0 rounded-l-full bg-[#FFE3CC]" />
                )}
                {isEnd && !isSingleDay && (
                  <div className="absolute inset-y-0 left-0 right-0 rounded-r-full bg-[#FFE3CC]" />
                )}

                {/* Day circular button */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDateClick(dateStr)}
                  onMouseEnter={() => {
                    if (tempStart && !tempEnd && dateStr >= tempStart) {
                      setHoveredDate(dateStr);
                    }
                  }}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    disabled
                      ? 'text-[#735340]/30 line-through cursor-not-allowed'
                      : isStart || isEnd
                      ? 'bg-[#E8772E] text-white shadow-sm ring-2 ring-[#E8772E]'
                      : isBetween
                      ? 'text-[#3B2216] hover:bg-[#E8772E]/20'
                      : 'text-[#3B2216] hover:bg-[#FFF4E6] cursor-pointer'
                  } ${
                    isTodayDate && !isStart && !isEnd
                      ? 'ring-2 ring-[#1AA3A3] text-[#1AA3A3]'
                      : ''
                  }`}
                  aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${
                    disabled ? ' (Unavailable)' : ''
                  }`}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const daysCount = getSelectedDaysCount();

  // Status line text above the calendar
  const statusLineText = () => {
    if (activeTarget === 'end' && tempStart && !tempEnd) {
      return 'Now tap a date for Return';
    }
    return 'Tap a date for Pickup';
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* TWO CLICKABLE FIELDS SIDE-BY-SIDE: EXACTLY EQUAL WIDTH & BALANCED WITH LABELS ON TOP */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Pickup Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E8772E]" />
            {pickupLabel}
          </label>
          <button
            type="button"
            onClick={() => openFor('start')}
            className={`w-full h-13 px-3.5 rounded-xl border-2 text-left bg-[#FFFBF5] transition-all flex items-center justify-between cursor-pointer select-none ${
              isOpen && activeTarget === 'start'
                ? 'border-[#E8772E] ring-4 ring-[#E8772E]/15 bg-white'
                : 'border-[#F0DFC8] hover:border-[#E8772E]/60'
            }`}
            aria-expanded={isOpen && activeTarget === 'start'}
            aria-haspopup="dialog"
          >
            <span className="text-sm font-semibold text-[#3B2216] truncate">
              {formatInputDisplay(tempStart) || (
                <span className="text-[#735340]/60 font-normal">Add date</span>
              )}
            </span>
            <Calendar className="w-4 h-4 text-[#735340]/40 shrink-0" />
          </button>
        </div>

        {/* Return Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1AA3A3]" />
            {returnLabel}
          </label>
          <button
            type="button"
            onClick={() => openFor('end')}
            className={`w-full h-13 px-3.5 rounded-xl border-2 text-left bg-[#FFFBF5] transition-all flex items-center justify-between cursor-pointer select-none ${
              isOpen && activeTarget === 'end'
                ? 'border-[#E8772E] ring-4 ring-[#E8772E]/15 bg-white'
                : 'border-[#F0DFC8] hover:border-[#1AA3A3]/60'
            }`}
            aria-expanded={isOpen && activeTarget === 'end'}
            aria-haspopup="dialog"
          >
            <span className="text-sm font-semibold text-[#3B2216] truncate">
              {formatInputDisplay(tempEnd) || (
                <span className="text-[#735340]/60 font-normal">Add date</span>
              )}
            </span>
            <Calendar className="w-4 h-4 text-[#735340]/40 shrink-0" />
          </button>
        </div>
      </div>

      {/* CALENDAR POPOVER: POSITIONED DIRECTLY BELOW THE DATE INPUTS (NO FLOATING DISCONNECTION) */}
      {isOpen && (
        <>
          {/* Mobile Overlay & Bottom Sheet (<768px) */}
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => {
                setIsOpen(false);
                setConflictMessage(null);
              }}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Select rental dates"
              className="fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-3xl border-t border-[#F3DFC8] shadow-[0_-10px_40px_rgba(59,34,22,0.2)] max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250"
            >
              {/* Pull handle */}
              <div className="pt-2 pb-1 flex justify-center">
                <div className="w-12 h-1 bg-[#E6D5C3] rounded-full" />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#F0DFC8]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8772E] animate-pulse" />
                  <span className="text-xs font-bold text-[#3B2216]">
                    {statusLineText()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setConflictMessage(null);
                  }}
                  className="w-8 h-8 rounded-full bg-[#FAF0E4] hover:bg-[#F0DFC8] text-[#735340] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close calendar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conflict Alert */}
              {conflictMessage && (
                <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{conflictMessage}</span>
                </div>
              )}

              {/* Calendar Body (1 month scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
                {renderMonth(currentMonth, true)}

                {/* Legend */}
                <div className="w-full max-w-[280px] mt-4 pt-3 border-t border-[#F0DFC8]/60 flex items-center justify-around text-[10px] font-semibold text-[#735340]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#E8772E]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-3 bg-[#FFE3CC] rounded-xs" />
                    <span>Trip</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full ring-2 ring-[#1AA3A3]" />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-[#735340]/40">15</span>
                    <span>Booked</span>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 p-4 border-t border-[#F0DFC8] bg-white flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(59,34,22,0.05)]">
                <div className="text-xs">
                  {tempStart && tempEnd ? (
                    <span className="font-bold text-[#3B2216]">
                      {daysCount} {daysCount === 1 ? 'day' : 'days'} ·{' '}
                      <span className="text-[#E8772E]">
                        {format(parseISO(tempStart), 'MMM d')} – {format(parseISO(tempEnd), 'MMM d')}
                      </span>
                    </span>
                  ) : tempStart ? (
                    <span className="text-[#735340] text-xs">
                      Pickup: <strong>{format(parseISO(tempStart), 'MMM d')}</strong>
                    </span>
                  ) : (
                    <span className="text-[#735340] text-xs">Choose pickup date</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#735340] hover:bg-[#FAF0E4] transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={!tempStart || !tempEnd}
                    onClick={handleDone}
                    className="px-5 py-2.5 rounded-xl bg-[#E8772E] hover:bg-[#D4661E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Dropdown Card: Anchored directly below the date inputs, scrolls with page naturally */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select rental dates"
            className={`hidden md:block absolute top-full mt-2.5 z-50 w-[640px] bg-white rounded-3xl border border-[#F3DFC8] shadow-[0_20px_50px_rgba(59,34,22,0.18)] p-6 animate-in fade-in zoom-in-95 duration-150 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Header with status line and close button */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0DFC8]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8772E] animate-pulse" />
                <span className="text-xs font-bold text-[#3B2216]">
                  {statusLineText()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setConflictMessage(null);
                }}
                className="w-7 h-7 rounded-full bg-[#FAF0E4] hover:bg-[#F0DFC8] text-[#735340] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close calendar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inline Conflict Warning */}
            {conflictMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{conflictMessage}</span>
              </div>
            )}

            {/* 2 Months Side by Side: Equal 280px Columns */}
            <div className="flex items-start justify-center gap-6">
              {renderMonth(currentMonth, true)}
              {renderMonth(addMonths(currentMonth, 1), false)}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-3 border-t border-[#F0DFC8]/60 flex items-center justify-around text-[10px] font-semibold text-[#735340]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#E8772E]" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3 bg-[#FFE3CC] rounded-xs" />
                <span>Trip window</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full ring-2 ring-[#1AA3A3]" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="line-through text-[#735340]/40">15</span>
                <span>Unavailable</span>
              </div>
            </div>

            {/* Popover Footer: Duration summary & Action buttons */}
            <div className="mt-4 pt-3 border-t border-[#F0DFC8] flex items-center justify-between gap-3">
              <div className="text-xs">
                {tempStart && tempEnd ? (
                  <span className="font-bold text-[#3B2216]">
                    {daysCount} {daysCount === 1 ? 'day' : 'days'} ·{' '}
                    <span className="text-[#E8772E]">
                      {format(parseISO(tempStart), 'MMM d')} – {format(parseISO(tempEnd), 'MMM d')}
                    </span>
                  </span>
                ) : tempStart ? (
                  <span className="text-[#735340] text-xs">
                    Pickup: <strong>{format(parseISO(tempStart), 'MMM d')}</strong> · Pick return date
                  </span>
                ) : (
                  <span className="text-[#735340] text-xs">Choose pickup date</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#735340] hover:bg-[#FAF0E4] transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={!tempStart || !tempEnd}
                  onClick={handleDone}
                  className="px-5 py-2 rounded-xl bg-[#E8772E] hover:bg-[#D4661E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
