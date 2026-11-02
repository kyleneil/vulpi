import Link from 'next/link';
import { formatDateRangePH } from '@/lib/formatters';
import { Calendar, ArrowRight } from 'lucide-react';
import { Mascot } from '@/components/brand/Mascot';

interface NearestAvailableDatesProps {
  carTypeLabel: string;
  requestedStartDate: string;
  requestedEndDate: string;
  destination?: string;
  suggestions?: {
    before?: { start: string; end: string; carCount: number };
    after?: { start: string; end: string; carCount: number };
  };
}

export function NearestAvailableDates({
  carTypeLabel,
  requestedStartDate,
  requestedEndDate,
  destination = 'within_cdo',
  suggestions,
}: NearestAvailableDatesProps) {
  const reqRange = formatDateRangePH(requestedStartDate, requestedEndDate);

  return (
    <div className="bg-[#FFF4E6] border-2 border-[#F5B82E]/50 rounded-3xl p-6 md:p-8 text-center max-w-2xl mx-auto shadow-sm">
      <Mascot size="md" className="mx-auto mb-3" />
      <h3 className="text-xl font-black text-[#3B2216]">
        No {carTypeLabel}s free {reqRange}
      </h3>
      <p className="text-sm text-[#735340] mt-1.5 max-w-md mx-auto">
        Don’t worry! Here are the closest upcoming dates when {carTypeLabel}s are ready to roll in Cagayan de Oro:
      </p>

      {/* Suggestion buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {suggestions?.after && (
          <Link
            href={`/cars?start=${suggestions.after.start}&end=${suggestions.after.end}&dest=${destination}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border border-[#E8772E] text-[#E8772E] hover:bg-[#E8772E] hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
            <Calendar className="w-4 h-4" />
            <span>Available {formatDateRangePH(suggestions.after.start, suggestions.after.end)}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {suggestions?.before && (
          <Link
            href={`/cars?start=${suggestions.before.start}&end=${suggestions.before.end}&dest=${destination}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border border-[#1AA3A3] text-[#1AA3A3] hover:bg-[#1AA3A3] hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
            <Calendar className="w-4 h-4" />
            <span>Earlier: {formatDateRangePH(suggestions.before.start, suggestions.before.end)}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="mt-5">
        <Link
          href={`/cars?start=${requestedStartDate}&end=${requestedEndDate}&type=all&dest=${destination}`}
          className="text-xs font-bold text-[#735340] hover:text-[#E8772E] underline underline-offset-4"
        >
          Or view other available vehicle types on these dates →
        </Link>
      </div>
    </div>
  );
}
