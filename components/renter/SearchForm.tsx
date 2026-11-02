'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAR_TYPES, POPULAR_CDO_DESTINATIONS } from '@/lib/constants';
import { MapPin, Car as CarIcon, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/renter/DateRangePicker';

interface SearchFormProps {
  initialStartDate?: string;
  initialEndDate?: string;
  initialCarType?: string;
  initialDestination?: string;
  className?: string;
}

export function SearchForm({
  initialStartDate,
  initialEndDate,
  initialCarType = 'all',
  initialDestination = 'within_cdo',
  className = '',
}: SearchFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Start with empty strings unless user arrived with dates in URL
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [carType, setCarType] = useState(initialCarType);
  const [destination, setDestination] = useState(initialDestination);

  // Sync state if initial props change
  useEffect(() => {
    if (initialStartDate !== undefined) setStartDate(initialStartDate);
    if (initialEndDate !== undefined) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (carType && carType !== 'all') params.set('type', carType);
    if (destination) params.set('dest', destination);

    router.push(`/cars?${params.toString()}`);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(59,34,22,0.08)] border border-[#F0DFC8] relative ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {/* Custom Date Range Picker: spans 2 columns on desktop */}
        <div className="md:col-span-2">
          <DateRangePicker
            anchorRef={formRef}
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        {/* Car Type: 1 column */}
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <CarIcon className="w-3.5 h-3.5 text-[#E8772E]" />
            Car Type
          </label>
          <select
            value={carType}
            onChange={(e) => setCarType(e.target.value)}
            className="w-full h-13 px-3.5 rounded-xl border-2 border-[#F0DFC8] bg-[#FFFBF5] text-[#3B2216] font-medium text-sm focus:outline-none focus:border-[#E8772E] focus:ring-4 focus:ring-[#E8772E]/15 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Any Car Type (All)</option>
            {CAR_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label} ({type.sample.split(',')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Destination: 1 column */}
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1AA3A3]" />
            Destination
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full h-13 px-3.5 rounded-xl border-2 border-[#F0DFC8] bg-[#FFFBF5] text-[#3B2216] font-medium text-sm focus:outline-none focus:border-[#1AA3A3] focus:ring-4 focus:ring-[#1AA3A3]/15 transition-all appearance-none cursor-pointer"
          >
            {POPULAR_CDO_DESTINATIONS.map((dest) => (
              <option key={dest.value} value={dest.value}>
                {dest.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="w-full md:w-auto h-13 px-8 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E8772E]/25 transition-all transform active:scale-95 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          Find Available Cars
        </button>
      </div>
    </form>
  );
}
