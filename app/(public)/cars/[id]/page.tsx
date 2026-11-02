import { createPublicClient } from '@/lib/supabase/public';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AvailabilityCalendar } from '@/components/renter/AvailabilityCalendar';
import { CarBookingCard } from '@/components/renter/CarBookingCard';
import { formatPHP, formatDateRangePH, calculateRentalDays } from '@/lib/formatters';
import { getSafeCarPhoto } from '@/lib/constants';
import { DestinationType } from '@/types/database';

export const revalidate = 60;
import {
  Users,
  Fuel,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Phone,
  MessageCircle,
} from 'lucide-react';

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string; dest?: string }>;
}

export default async function CarDetailPage({ params, searchParams }: CarDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;
  const startDate = search.start;
  const endDate = search.end;
  const destination = (search.dest as DestinationType) || 'within_cdo';

  const supabase = createPublicClient();

  let car: any = null;
  let calendarRanges: { startDate: string; endDate: string; type: 'booked' | 'blocked' }[] = [];

  const { data: fetchedCar } = await supabase
    .from('cars')
    .select('*, owner:owners(*)')
    .eq('id', id)
    .single();

  if (fetchedCar) {
    car = fetchedCar;

    // Fetch booked ranges
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('car_id', id)
      .in('status', ['confirmed', 'pending']);

    (bookings as any[])?.forEach((b: any) => {
      calendarRanges.push({ startDate: b.start_date, endDate: b.end_date, type: 'booked' });
    });

    // Fetch blocked ranges
    const { data: blocks } = await supabase
      .from('blocked_dates')
      .select('start_date, end_date')
      .eq('car_id', id);

    (blocks as any[])?.forEach((b: any) => {
      calendarRanges.push({ startDate: b.start_date, endDate: b.end_date, type: 'blocked' });
    });
  } else {
    notFound();
  }

  const dailyRate = destination === 'outside_cdo' && car.daily_rate_out_of_city
    ? car.daily_rate_out_of_city
    : car.daily_rate_in_city;

  const hasDates = Boolean(startDate && endDate);
  const days = hasDates ? calculateRentalDays(startDate!, endDate!) : 1;
  const estimatedTotal = dailyRate * days;

  // Build request link
  const requestParams = new URLSearchParams();
  if (startDate) requestParams.set('start', startDate);
  if (endDate) requestParams.set('end', endDate);
  if (destination) requestParams.set('dest', destination);
  const requestUrl = `/cars/${car.id}/request?${requestParams.toString()}`;

  const mainPhoto = getSafeCarPhoto(car.photos?.[0]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="text-xs text-[#735340] flex items-center gap-2">
        <Link href="/cars" className="hover:text-[#E8772E]">All Cars</Link>
        <span>/</span>
        <span className="text-[#3B2216] font-bold">{car.make} {car.model}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photos + Specs + Calendar */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#F0DFC8] shadow-sm">
            <div className="relative aspect-[16/10] w-full bg-[#FAF0E4]">
              <Image
                src={mainPhoto}
                alt={`${car.make} ${car.model}`}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-[#3B2216]/85 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {car.car_type}
                </span>
                {car.driver_available && (
                  <span className="bg-[#1AA3A3] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> Driver Available
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail preview if more photos exist */}
            {car.photos && car.photos.length > 1 && (
              <div className="p-3 flex gap-2 overflow-x-auto bg-[#FFFBF5] border-t border-[#F0DFC8]/60">
                {car.photos.map((p: string, i: number) => (
                  <div key={i} className="relative w-20 h-14 rounded-xl overflow-hidden border border-[#F0DFC8] shrink-0">
                    <Image src={p} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-4">
            <h2 className="text-xl font-black text-[#3B2216]">Vehicle Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-[#FFFBF5] p-3.5 rounded-2xl border border-[#F0DFC8]">
                <span className="text-[11px] font-bold uppercase text-[#735340] block">Transmission</span>
                <span className="font-bold text-sm text-[#3B2216] capitalize">{car.transmission}</span>
              </div>
              <div className="bg-[#FFFBF5] p-3.5 rounded-2xl border border-[#F0DFC8]">
                <span className="text-[11px] font-bold uppercase text-[#735340] block">Capacity</span>
                <span className="font-bold text-sm text-[#3B2216]">{car.seats} Seats</span>
              </div>
              <div className="bg-[#FFFBF5] p-3.5 rounded-2xl border border-[#F0DFC8]">
                <span className="text-[11px] font-bold uppercase text-[#735340] block">Fuel Type</span>
                <span className="font-bold text-sm text-[#3B2216] capitalize">{car.fuel_type}</span>
              </div>
              <div className="bg-[#FFFBF5] p-3.5 rounded-2xl border border-[#F0DFC8]">
                <span className="text-[11px] font-bold uppercase text-[#735340] block">Model Year</span>
                <span className="font-bold text-sm text-[#3B2216]">{car.year}</span>
              </div>
            </div>

            {car.notes && (
              <div className="mt-4 pt-4 border-t border-[#F0DFC8]/60">
                <h4 className="text-xs font-bold uppercase text-[#735340] mb-1">Owner Notes</h4>
                <p className="text-xs text-[#3B2216] leading-relaxed">{car.notes}</p>
              </div>
            )}
          </div>

          {/* Interactive Availability Calendar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#3B2216] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E8772E]" /> Live Availability Calendar
                </h2>
                <p className="text-xs text-[#735340]">
                  Greyed out days with a strikethrough are already booked or held.
                </p>
              </div>
            </div>

            <AvailabilityCalendar
              ranges={calendarRanges}
              selectedStart={startDate}
              selectedEnd={endDate}
            />
          </div>
        </div>

        {/* Right Column: Rate Card & Booking Action */}
        <div className="space-y-6">
          <CarBookingCard
            car={car}
            initialStartDate={startDate}
            initialEndDate={endDate}
            initialDestination={destination}
            disabledRanges={calendarRanges}
          />
        </div>
      </div>
    </div>
  );
}
