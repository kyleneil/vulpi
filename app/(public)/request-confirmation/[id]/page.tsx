import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Mascot } from '@/components/brand/Mascot';
import { formatPHP, formatDateRangePH } from '@/lib/formatters';
import Link from 'next/link';
import {
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Calendar,
  Car,
  Home,
} from 'lucide-react';
import { differenceInHours } from 'date-fns';

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: fetchedBooking } = await supabase
    .from('bookings')
    .select('*, car:cars(*, owner:owners(*))')
    .eq('id', id)
    .single();

  if (!fetchedBooking) {
    notFound();
  }

  const booking = fetchedBooking;

  const owner = booking.car?.owner;
  const cleanPhone = owner?.phone?.replace(/\s+/g, '') || '';
  const hoursRemaining = Math.max(
    0,
    differenceInHours(new Date(booking.hold_expires_at), new Date())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Mascot & Success Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-lg text-center space-y-4">
        <Mascot size="lg" className="mx-auto" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" /> Request Successfully Sent!
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#3B2216]">
          Your Dates are Held for 24 Hours!
        </h1>

        <p className="text-sm text-[#735340] max-w-md mx-auto leading-relaxed">
          The owner will review your booking details and contact you directly via call or message to finalize pickup in Cagayan de Oro.
        </p>

        {/* 24h Countdown highlight */}
        <div className="bg-[#FFF4E6] p-4 rounded-2xl border border-[#F5B82E]/50 max-w-md mx-auto flex items-center justify-center gap-3 text-xs text-[#3B2216]">
          <Clock className="w-5 h-5 text-[#E8772E] shrink-0" />
          <span>
            Dates held exclusively for you. <strong>{hoursRemaining} hours</strong> remaining on hold.
          </span>
        </div>
      </div>

      {/* Owner Contact Actions (Click to Call & Message) */}
      {owner && (
        <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1AA3A3]">
              Need to coordinate fast?
            </span>
            <h2 className="text-lg font-black text-[#3B2216] mt-0.5">
              Contact {owner.name_or_business} Directly
            </h2>
            <p className="text-xs text-[#735340]">
              Pickup point: {owner.pickup_location}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={`tel:${cleanPhone}`}
              className="h-13 rounded-2xl bg-[#1AA3A3] hover:bg-[#0F7F82] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              Call Owner ({owner.phone})
            </a>

            {owner.messenger_link ? (
              <a
                href={owner.messenger_link}
                target="_blank"
                rel="noopener noreferrer"
                className="h-13 rounded-2xl bg-[#0084FF] hover:bg-[#0070D6] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on Messenger
              </a>
            ) : (
              <a
                href={`sms:${cleanPhone}`}
                className="h-13 rounded-2xl bg-[#FAF0E4] hover:bg-[#F0DFC8] border border-[#F0DFC8] text-[#3B2216] font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#E8772E]" />
                Send SMS
              </a>
            )}
          </div>
        </div>
      )}

      {/* Booking Summary Box */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DFC8] shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-[#3B2216]">Reservation Summary</h3>
        <div className="bg-[#FFFBF5] rounded-2xl p-4 border border-[#F0DFC8] space-y-2 text-xs text-[#3B2216]">
          <div className="flex items-center justify-between">
            <span className="text-[#735340]">Car:</span>
            <strong>{booking.car?.year} {booking.car?.make} {booking.car?.model}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#735340]">Dates:</span>
            <strong>{formatDateRangePH(booking.start_date, booking.end_date)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#735340]">Destination:</span>
            <span className="capitalize">{booking.destination_type === 'outside_cdo' ? 'Outside CDO' : 'Within CDO'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#F0DFC8] text-sm">
            <span className="font-bold">Estimated Total:</span>
            <strong className="text-[#E8772E] font-black">{formatPHP(booking.estimated_total)}</strong>
          </div>
        </div>

        <p className="text-[11px] text-[#735340] italic text-center">
          "Final price and details are confirmed by the owner." Settle payment directly upon car handover.
        </p>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E8772E] hover:underline"
        >
          <Home className="w-4 h-4" /> Back to Vulpi Home
        </Link>
      </div>
    </div>
  );
}
