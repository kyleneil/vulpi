import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DEMO_CARS } from '@/lib/mock-data';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';
import { Clock, CheckCircle2, XCircle, ArrowRight, Phone } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default async function OwnerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'pending' } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let bookings: any[] = [];

  if (user) {
    const { data: owner } = await supabase
      .from('owners')
      .select('id, cars(id)')
      .eq('user_id', user.id)
      .single();

    const typedOwner = owner as any;
    if (typedOwner && typedOwner.cars && typedOwner.cars.length > 0) {
      const carIds = typedOwner.cars.map((c: { id: string }) => c.id);
      let query = supabase
        .from('bookings')
        .select('*, car:cars(*)')
        .in('car_id', carIds);

      if (tab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (tab === 'confirmed') {
        query = query.eq('status', 'confirmed');
      } else {
        query = query.in('status', ['completed', 'declined', 'cancelled', 'expired']);
      }

      const { data } = await query.order('created_at', { ascending: false });
      bookings = data || [];
    }
  } else {
    // Mock sample bookings
    bookings = [
      {
        id: 'mock-req-1',
        car_id: DEMO_CARS[0].id,
        renter_name: 'Mark Villanueva',
        renter_phone: '+63 917 555 1234',
        renter_email: 'mark.v@example.ph',
        start_date: '2026-11-05',
        end_date: '2026-11-07',
        destination_type: 'within_cdo',
        with_driver: false,
        estimated_total: 4800,
        status: tab === 'pending' ? 'pending' : tab === 'confirmed' ? 'confirmed' : 'completed',
        hold_expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        car: DEMO_CARS[0],
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#3B2216]">Requests Inbox</h1>
        <p className="text-sm text-[#735340] mt-1">
          Review incoming rental inquiries, call or SMS renters, and confirm bookings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#F0DFC8] gap-4">
        <Link
          href="/owner/requests?tab=pending"
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            tab === 'pending'
              ? 'border-[#E8772E] text-[#E8772E]'
              : 'border-transparent text-[#735340] hover:text-[#3B2216]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Holds (24h)
        </Link>
        <Link
          href="/owner/requests?tab=confirmed"
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            tab === 'confirmed'
              ? 'border-[#1AA3A3] text-[#1AA3A3]'
              : 'border-transparent text-[#735340] hover:text-[#3B2216]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirmed Bookings
        </Link>
        <Link
          href="/owner/requests?tab=history"
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            tab === 'history'
              ? 'border-[#3B2216] text-[#3B2216]'
              : 'border-transparent text-[#735340] hover:text-[#3B2216]'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Completed & Past
        </Link>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#F0DFC8] shadow-sm max-w-md mx-auto">
          <p className="text-sm font-bold text-[#3B2216]">No {tab} requests found</p>
          <p className="text-xs text-[#735340] mt-1">
            When renters request your cars on Vulpi, they will appear in this inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any) => {
            const hoursLeft = Math.max(
              0,
              differenceInHours(new Date(booking.hold_expires_at), new Date())
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-5 border border-[#F0DFC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-lg text-[#3B2216]">
                      {booking.car?.make} {booking.car?.model} ({booking.car?.year})
                    </span>

                    {booking.status === 'pending' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {hoursLeft}h hold remaining
                      </span>
                    )}

                    {booking.status === 'confirmed' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#735340] mt-1">
                    <strong>Renter:</strong> {booking.renter_name} •{' '}
                    <span className="font-semibold text-[#3B2216]">{booking.renter_phone}</span>
                  </p>

                  <p className="text-xs text-[#735340] mt-0.5">
                    <strong>Rental Dates:</strong> {formatDateRangePH(booking.start_date, booking.end_date)}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="font-black text-[#E8772E] text-sm">
                      {formatPHP(booking.estimated_total)}
                    </span>
                    <span className="text-[#735340]">
                      ({booking.destination_type === 'outside_cdo' ? 'Outside CDO' : 'Within CDO'})
                    </span>
                    {booking.with_driver && (
                      <span className="bg-[#1AA3A3]/10 text-[#0F7F82] font-bold px-2 py-0.5 rounded-full text-[10px]">
                        With Driver
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={`tel:${booking.renter_phone}`}
                    className="h-10 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-[#3B2216] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1AA3A3]" /> Call
                  </a>

                  <Link
                    href={`/owner/requests/${booking.id}`}
                    className="h-10 px-5 rounded-xl bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
