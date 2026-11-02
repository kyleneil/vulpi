'use client';

import { useState } from 'react';
import { addBlockedDateAction } from '@/app/actions/owner-calendar';
import { BLOCK_REASONS } from '@/lib/constants';
import { BlockReason } from '@/types/database';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInCalendarDays, parseISO } from 'date-fns';

interface BlockDateModalProps {
  carId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BlockDateModal({ carId, isOpen, onClose, onSuccess }: BlockDateModalProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState<BlockReason>('repairs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;
    try {
      const startObj = parseISO(newStart);
      let durationDays = 1;
      if (startDate && endDate) {
        const currentDiff = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
        if (currentDiff >= 0) durationDays = currentDiff;
      }
      setEndDate(format(addDays(startObj, durationDays), 'yyyy-MM-dd'));
    } catch {
      if (newStart > endDate) setEndDate(newStart);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const res = await addBlockedDateAction(carId, startDate, endDate, reason);
    setIsSubmitting(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3B2216]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0DFC8] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF0E4] text-[#3B2216] flex items-center justify-center hover:bg-[#F0DFC8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-black text-[#3B2216] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E8772E]" />
          Block Dates for this Car
        </h3>
        <p className="text-xs text-[#735340] mt-1">
          Mark dates as unavailable for repairs, personal use, or offline walk-in bookings.
        </p>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
              Reason for Blocking
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as BlockReason)}
              className="w-full h-11 px-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            >
              {BLOCK_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-full border border-[#F0DFC8] text-[#735340] font-bold text-sm hover:bg-[#FAF0E4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Blocking...' : 'Confirm Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
