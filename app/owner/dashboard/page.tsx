import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DEMO_CARS, DEMO_OWNERS } from '@/lib/mock-data';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';
import { Car, Clock, Plus, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cars: any[] = [];
  let pendingRequests: any[] = [];
  let ownerName = 'Partner Owner';

  if (user) {
    const { data: owner } = await supabase
      .from('owners')
      .select('*, cars(*)')
      .eq('user_id', user.id)
      .single();

    if (owner) {
      const typedOwner = owner as any;
      ownerName = typedOwner.name_or_business;
      cars = typedOwner.cars || [];

      const carIds = cars.map((c: { id: string }) => c.id);
      if (carIds.length > 0) {
        const { data: requests } = await supabase
          .from('bookings')
          .select('*, car:cars(*)')
          .in('car_id', carIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        pendingRequests = requests || [];
      }
    }
  } else {
    // Demo fallback mode for instant previews
    cars = DEMO_CARS.filter(c => c.owner_id === DEMO_OWNERS[0].id);
    ownerName = DEMO_OWNERS[0].name_or_business;
    pendingRequests = [
      {
        id: 'demo-req-1',
        car_id: DEMO_CARS[0].id,
        renter_name: 'Mark Villanueva',
        renter_phone: '+63 917 555 1234',
        start_date: '2026-11-05',
        end_date: '2026-11-07',
        destination_type: 'within_cdo',
        estimated_total: 4800,
        status: 'pending',
        hold_expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        car: DEMO_CARS[0],
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8772E] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1AA3A3]" /> Owner Portal • Cagayan de Oro
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#3B2216] mt-1">
            Welcome back, {ownerName}!
          </h1>
          <p className="text-sm text-[#735340] mt-1">
            Manage your rental fleet, calendar availability, and renter bookings.
          </p>
        </div>

        <Link
          href="/owner/cars/new"
          className="h-12 px-6 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#E8772E]/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          List a New Car
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#735340]">Active Cars</span>
            <div className="w-10 h-10 rounded-2xl bg-[#FFF4E6] flex items-center justify-center text-[#E8772E]">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#3B2216] mt-2">
            {cars.filter((c: { is_active: boolean }) => c.is_active).length}
          </div>
          <Link href="/owner/cars" className="text-xs font-bold text-[#1AA3A3] hover:underline mt-2 inline-block">
            Manage fleet →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#735340]">Pending Holds</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-[#F5B82E]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#3B2216] mt-2">
            {pendingRequests.length}
          </div>
          <span className="text-xs text-[#735340] mt-2 block">
            Requires confirmation within 24h
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#735340]">Marketplace</span>
            <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] flex items-center justify-center text-[#1AA3A3]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#3B2216] mt-3">
            Zero Online Payment Fees
          </div>
          <p className="text-xs text-[#735340] mt-1">
            Renters pay you directly via cash/transfer upon pickup.
          </p>
        </div>
      </div>

      {/* Pending Requests Alert Box */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#3B2216] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E8772E]" />
              Action Required: Pending 24-Hour Holds
            </h2>
            <p className="text-xs text-[#735340]">
              Renters are waiting for your confirmation call or message.
            </p>
          </div>
          <Link href="/owner/requests" className="text-xs font-bold text-[#1AA3A3] hover:underline">
            View all requests →
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-[#735340] bg-[#FFFBF5] rounded-2xl border border-dashed border-[#F0DFC8]">
            <p className="font-semibold text-sm">No pending requests right now.</p>
            <p className="text-xs mt-1">New booking requests will appear here with a 24-hour countdown.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0DFC8]/60">
            {pendingRequests.map((req: any) => {
              const hoursLeft = Math.max(
                0,
                differenceInHours(new Date(req.hold_expires_at), new Date())
              );

              return (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-[#3B2216]">
                        {req.car?.make} {req.car?.model} ({req.car?.year})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {hoursLeft}h hold left
                      </span>
                    </div>
                    <p className="text-xs text-[#735340] mt-1">
                      <strong>{req.renter_name}</strong> •{' '}
                      <span className="text-[#3B2216] font-semibold">{req.renter_phone}</span> •{' '}
                      {formatDateRangePH(req.start_date, req.end_date)}
                    </p>
                    <p className="text-xs font-bold text-[#E8772E] mt-0.5">
                      Estimated: {formatPHP(req.estimated_total)} ({req.destination_type === 'outside_cdo' ? 'Outside CDO' : 'Within CDO'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${req.renter_phone}`}
                      className="h-10 px-4 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-[#3B2216] hover:bg-[#FAF0E4] font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#1AA3A3]" /> Call
                    </a>
                    <Link
                      href={`/owner/requests/${req.id}`}
                      className="h-10 px-5 rounded-xl bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Review Request</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
