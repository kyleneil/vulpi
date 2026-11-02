import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RequestFormClient } from './request-form';
import { STARTER_TERMS_TEMPLATE } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface RequestPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string; dest?: string }>;
}

export default async function CarRequestPage({ params, searchParams }: RequestPageProps) {
  const { id } = await params;
  const search = await searchParams;
  const startDate = search.start;
  const endDate = search.end;
  const destination = search.dest || 'within_cdo';

  const supabase = await createClient();

  let car: any = null;
  const disabledRanges: { startDate: string; endDate: string; reason?: string }[] = [];

  const { data: fetchedCar } = await supabase
    .from('cars')
    .select('*, owner:owners(*)')
    .eq('id', id)
    .single();

  if (fetchedCar) {
    car = fetchedCar;

    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('car_id', id)
      .in('status', ['confirmed', 'pending']);

    (bookings as any[])?.forEach((b: any) => {
      disabledRanges.push({ startDate: b.start_date, endDate: b.end_date, reason: 'Already booked' });
    });

    const { data: blocks } = await supabase
      .from('blocked_dates')
      .select('start_date, end_date, reason')
      .eq('car_id', id);

    (blocks as any[])?.forEach((b: any) => {
      disabledRanges.push({ startDate: b.start_date, endDate: b.end_date, reason: b.reason || 'Owner blocked' });
    });
  } else {
    notFound();
  }

  const termsText = car.owner?.terms_text || STARTER_TERMS_TEMPLATE;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/cars/${car.id}`}
          className="w-10 h-10 rounded-full bg-white border border-[#F0DFC8] flex items-center justify-center text-[#735340] hover:bg-[#FAF0E4] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#3B2216]">Request Booking</h1>
          <p className="text-xs text-[#735340]">
            {car.year} {car.make} {car.model} • No online payment required
          </p>
        </div>
      </div>

      <RequestFormClient
        car={car}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialDestination={destination}
        ownerTerms={termsText}
        disabledRanges={disabledRanges}
      />
    </div>
  );
}
