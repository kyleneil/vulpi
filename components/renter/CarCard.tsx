import Image from 'next/image';
import Link from 'next/link';
import { CarWithOwner } from '@/types';
import { DestinationType } from '@/types/database';
import { formatPHP, calculateRentalDays } from '@/lib/formatters';
import { getSafeCarPhoto } from '@/lib/constants';
import { Users, Fuel, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

interface CarCardProps {
  car: CarWithOwner;
  startDate?: string;
  endDate?: string;
  destination?: DestinationType;
}

export function CarCard({ car, startDate, endDate, destination = 'within_cdo' }: CarCardProps) {
  const dailyRate = destination === 'outside_cdo' && car.daily_rate_out_of_city
    ? car.daily_rate_out_of_city
    : car.daily_rate_in_city;

  const hasDays = Boolean(startDate && endDate);
  const days = hasDays ? calculateRentalDays(startDate!, endDate!) : 1;
  const estimatedTotal = dailyRate * days;

  // Build detail link preserving search query parameters
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('start', startDate);
  if (endDate) queryParams.set('end', endDate);
  if (destination) queryParams.set('dest', destination);
  const detailUrl = `/cars/${car.id}?${queryParams.toString()}`;

  const photoUrl = getSafeCarPhoto(car.photos?.[0]);

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-[#F0DFC8] shadow-[0_4px_20px_rgb(59,34,22,0.06)] hover:shadow-[0_8px_30px_rgb(59,34,22,0.12)] transition-all flex flex-col justify-between">
      <div>
        {/* Photo + badges */}
        <div className="relative aspect-[16/10] w-full bg-[#FAF0E4] overflow-hidden">
          <Image
            src={photoUrl}
            alt={`${car.make} ${car.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="bg-[#3B2216]/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {car.car_type}
            </span>
            {car.driver_available && (
              <span className="bg-[#1AA3A3] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Driver Opt.
              </span>
            )}
          </div>
          {car.owner.is_verified && (
            <div className="absolute top-3 right-3 bg-white/95 text-[#0F7F82] text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1AA3A3]" />
              Verified Owner
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-[#3B2216] leading-snug group-hover:text-[#E8772E] transition-colors">
                {car.make} {car.model}
              </h3>
              <p className="text-xs text-[#735340] font-medium mt-0.5">
                {car.year} • {car.transmission === 'automatic' ? 'Automatic' : 'Manual'}
              </p>
            </div>
          </div>

          {/* Quick specs pill row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-[#735340] font-medium">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#E8772E]" />
              {car.seats} seats
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-[#1AA3A3]" />
              {car.fuel_type}
            </span>
          </div>

          {/* Pickup Location */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#735340] line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-[#E8772E] shrink-0" />
            <span>Pickup: {car.owner.pickup_location.split(',')[0]}</span>
          </div>
        </div>
      </div>

      {/* Pricing & CTA footer */}
      <div className="px-5 pb-5 pt-3 border-t border-[#F0DFC8]/60 bg-[#FFFBF5] rounded-b-3xl">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-[11px] font-medium text-[#735340] block">
              {destination === 'outside_cdo' ? 'Out-of-city rate' : 'In-city rate'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#E8772E]">
                {formatPHP(dailyRate)}
              </span>
              <span className="text-xs text-[#735340] font-medium">/ day</span>
            </div>
          </div>

          {hasDays && (
            <div className="text-right">
              <span className="text-[11px] font-medium text-[#735340] block">
                Total for {days} {days === 1 ? 'day' : 'days'}
              </span>
              <span className="text-base font-bold text-[#3B2216]">
                {formatPHP(estimatedTotal)}
              </span>
            </div>
          )}
        </div>

        <Link
          href={detailUrl}
          className="w-full h-11 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
        >
          View Details & Request
        </Link>
      </div>
    </div>
  );
}
