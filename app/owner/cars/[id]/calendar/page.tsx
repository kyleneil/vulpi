import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { OwnerCalendarClient } from './calendar-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CarCalendarPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: fetchedCar } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();

  if (!fetchedCar) {
    notFound();
  }

  const car = fetchedCar;

  const { data: blocks } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('car_id', id)
    .order('start_date', { ascending: true });
  const blockedDates = blocks || [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('car_id', id)
    .in('status', ['confirmed', 'pending'])
    .order('start_date', { ascending: true });
  const activeBookings = bookings || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/cars"
            className="w-10 h-10 rounded-full bg-white border border-[#F0DFC8] flex items-center justify-center text-[#735340] hover:bg-[#FAF0E4] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#3B2216]">
              {car.make} {car.model} Calendar
            </h1>
            <p className="text-xs text-[#735340]">
              Manage availability, view held & confirmed dates, or block maintenance.
            </p>
          </div>
        </div>
      </div>

      <OwnerCalendarClient
        car={car}
        initialBlockedDates={blockedDates}
        initialBookings={activeBookings}
      />
    </div>
  );
}
