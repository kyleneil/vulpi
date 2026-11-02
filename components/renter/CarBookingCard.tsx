'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DateRangePicker, DisabledDateRange } from '@/components/renter/DateRangePicker';
import { formatPHP, calculateRentalDays, formatDateRangePH } from '@/lib/formatters';
import { POPULAR_CDO_DESTINATIONS } from '@/lib/constants';
import { DestinationType } from '@/types/database';
import { MapPin, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface CarBookingCardProps {
  car: any;
  initialStartDate?: string;
  initialEndDate?: string;
  initialDestination?: DestinationType;
  disabledRanges?: DisabledDateRange[];
}

export function CarBookingCard({
  car,
  initialStartDate = '',
  initialEndDate = '',
  initialDestination = 'within_cdo',
  disabledRanges = [],
}: CarBookingCardProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [destination, setDestination] = useState<DestinationType>(initialDestination);

  // Sync state if props change (e.g. from URL updates)
  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
    if (initialDestination) setDestination(initialDestination);
  }, [initialStartDate, initialEndDate, initialDestination]);

  const hasDates = Boolean(startDate && endDate);
  const days = hasDates ? calculateRentalDays(startDate, endDate) : 1;

  const dailyRate =
    destination === 'outside_cdo' && car.daily_rate_out_of_city
      ? car.daily_rate_out_of_city
      : car.daily_rate_in_city;

  const estimatedTotal = dailyRate * days;

  // Build target booking request link
  const requestParams = new URLSearchParams();
  if (startDate) requestParams.set('start', startDate);
  if (endDate) requestParams.set('end', endDate);
  if (destination) requestParams.set('dest', destination);
  const requestUrl = `/cars/${car.id}/request?${requestParams.toString()}`;

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);

    // Update current URL quietly to keep query params in sync
    const params = new URLSearchParams(window.location.search);
    if (start) params.set('start', start); else params.delete('start');
    if (end) params.set('end', end); else params.delete('end');
    if (destination) params.set('dest', destination);
    router.replace(`/cars/${car.id}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-lg sticky top-24 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#1AA3A3]">
          {car.owner?.pickup_location ? car.owner.pickup_location.split(',')[0] : 'Cagayan de Oro'}
        </span>
        <h1 className="text-2xl font-black text-[#3B2216] mt-0.5">
          {car.make} {car.model} ({car.year})
        </h1>
      </div>

      {/* Date Range Picker */}
      <div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
          disabledRanges={disabledRanges}
          align="right"
        />
      </div>

      {/* Rates Breakdown */}
      <div className="bg-[#FFFBF5] rounded-2xl p-4 border border-[#F0DFC8] space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#735340]">Daily Rate (Within CDO):</span>
          <strong className="text-[#E8772E] text-base">{formatPHP(car.daily_rate_in_city)}/day</strong>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#735340]">Daily Rate (Outside CDO):</span>
          <strong className="text-[#3B2216]">{formatPHP(car.daily_rate_out_of_city)}/day</strong>
        </div>
        {car.driver_available && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-[#F0DFC8]/60">
            <span className="text-[#735340]">Optional Driver Fee:</span>
            <strong className="text-[#1AA3A3]">{formatPHP(car.driver_fee)}/day</strong>
          </div>
        )}
        {car.security_deposit && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-[#F0DFC8]/60">
            <span className="text-[#735340]">Refundable Deposit:</span>
            <span className="font-semibold text-[#3B2216]">{formatPHP(car.security_deposit)}</span>
          </div>
        )}
      </div>

      {/* Estimated Trip Summary */}
      {hasDates ? (
        <div className="bg-[#FFF4E6] p-4 rounded-2xl border border-[#F5B82E]/40 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-[#735340]">
            <span>Rental Window:</span>
            <strong className="text-[#3B2216]">{formatDateRangePH(startDate, endDate)}</strong>
          </div>
          <div className="flex items-center justify-between text-xs text-[#735340]">
            <span>Duration:</span>
            <strong className="text-[#3B2216]">{days} {days === 1 ? 'day' : 'days'}</strong>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#F0DFC8] text-base">
            <span className="font-bold text-[#3B2216]">Estimated Total:</span>
            <span className="font-black text-xl text-[#E8772E]">{formatPHP(estimatedTotal)}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#FAF0E4]/60 rounded-xl text-center text-xs text-[#735340]">
          Select pickup & return dates above to preview total rental price.
        </div>
      )}

      {/* Request CTA Button */}
      <Link
        href={requestUrl}
        className="w-full h-14 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E8772E]/25 transition-all transform active:scale-95 cursor-pointer"
      >
        <span>Request This Car</span>
        <ArrowRight className="w-5 h-5" />
      </Link>

      {/* Owner Info Box */}
      <div className="pt-4 border-t border-[#F0DFC8]/60 space-y-2 text-xs">
        <span className="font-bold uppercase text-[#735340] block">Car Owner & Pickup</span>
        <div className="flex items-start gap-2 text-[#3B2216]">
          <MapPin className="w-4 h-4 text-[#E8772E] shrink-0 mt-0.5" />
          <span>{car.owner?.pickup_location || 'Cagayan de Oro City'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
          <ShieldCheck className="w-4 h-4" /> Verified Vulpi partner ({car.owner?.name_or_business || 'Local Host'})
        </div>
      </div>
    </div>
  );
}
