import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_CARS, DEMO_OWNERS } from '@/lib/mock-data';
import { RequestActionButtons } from '@/components/owner/RequestActionButtons';
import { formatPHP, formatDateRangePH, calculateRentalDays } from '@/lib/formatters';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, ShieldCheck, User, Calendar, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { differenceInHours } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  let booking: any = null;
  let signedLicenseUrl: string | null = null;

  const { data: fetchedBooking } = await supabase
    .from('bookings')
    .select('*, car:cars(*, owner:owners(*))')
    .eq('id', id)
    .single();

  if (fetchedBooking) {
    booking = fetchedBooking;

    // If a driver license photo path exists, generate a signed URL from the private bucket
    if (booking.license_photo_path) {
      const adminClient = createAdminClient();
      const { data: signedData } = await adminClient.storage
        .from('licenses')
        .createSignedUrl(booking.license_photo_path, 3600);
      if (signedData) {
        signedLicenseUrl = signedData.signedUrl;
      }
    }
  } else {
    // Mock sample request
    const demoCar = DEMO_CARS[0];
    booking = {
      id,
      car_id: demoCar.id,
      renter_name: 'Mark Villanueva',
      renter_phone: '+63 917 555 1234',
      renter_email: 'mark.v@example.ph',
      start_date: '2026-11-05',
      end_date: '2026-11-07',
      destination_type: 'within_cdo',
      destination_details: 'Airport pickup to Pueblo de Oro hotel, then meetings around Limketkai.',
      with_driver: false,
      estimated_total: 4800,
      status: 'pending',
      hold_expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      license_photo_path: null,
      terms_accepted_at: new Date().toISOString(),
      owner_note: null,
      car: demoCar,
    };
  }

  const days = calculateRentalDays(booking.start_date, booking.end_date);
  const hoursLeft = Math.max(
    0,
    differenceInHours(new Date(booking.hold_expires_at), new Date())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/requests"
          className="w-10 h-10 rounded-full bg-white border border-[#F0DFC8] flex items-center justify-center text-[#735340] hover:bg-[#FAF0E4] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#3B2216]">Booking Request Details</h1>
          <p className="text-xs text-[#735340]">ID: {booking.id}</p>
        </div>
      </div>

      {/* 24-Hour Hold Alert Box */}
      {booking.status === 'pending' && (
        <div className="bg-[#FFF4E6] border-2 border-[#F5B82E] rounded-3xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F5B82E]/20 flex items-center justify-center text-[#3B2216] shrink-0">
            <Clock className="w-6 h-6 text-[#E8772E]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#3B2216]">
              24-Hour Hold Active: {hoursLeft} hours remaining
            </h3>
            <p className="text-xs text-[#735340] mt-1 leading-relaxed">
              These dates are locked on your calendar until you accept or decline. Please reach out to the renter promptly by call or SMS to confirm trip arrangements.
            </p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        {/* Car Summary */}
        <div className="flex items-center justify-between pb-6 border-b border-[#F0DFC8]/60">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#735340]">Vehicle Requested</span>
            <h2 className="text-xl font-black text-[#3B2216]">
              {booking.car?.year} {booking.car?.make} {booking.car?.model}
            </h2>
            <p className="text-xs text-[#735340]">
              {booking.car?.transmission} • {booking.car?.seats} seats
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              booking.status === 'confirmed'
                ? 'bg-emerald-100 text-emerald-800'
                : booking.status === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            {booking.status}
          </span>
        </div>

        {/* Renter Information */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#E8772E]" /> Renter Information
          </h3>
          <div className="bg-[#FFFBF5] rounded-2xl p-4 border border-[#F0DFC8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-[#735340] block">Full Name:</span>
              <strong className="text-[#3B2216]">{booking.renter_name}</strong>
            </div>
            <div>
              <span className="text-xs text-[#735340] block">Mobile Phone:</span>
              <strong className="text-[#E8772E]">{booking.renter_phone}</strong>
            </div>
            <div>
              <span className="text-xs text-[#735340] block">Email:</span>
              <span className="text-[#3B2216]">{booking.renter_email || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#1AA3A3]" /> Rental Window & Destination
          </h3>
          <div className="bg-[#FFFBF5] rounded-2xl p-4 border border-[#F0DFC8] space-y-2.5 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs text-[#735340] block">Dates Requested:</span>
                <strong className="text-[#3B2216]">
                  {formatDateRangePH(booking.start_date, booking.end_date)} ({days} {days === 1 ? 'day' : 'days'})
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#735340] block">Destination Type:</span>
                <strong className="text-[#1AA3A3]">
                  {booking.destination_type === 'outside_cdo' ? 'Outside Cagayan de Oro' : 'Within Cagayan de Oro'}
                </strong>
              </div>
            </div>

            {booking.destination_details && (
              <div className="pt-2 border-t border-[#F0DFC8]/50">
                <span className="text-xs text-[#735340] block">Itinerary / Destination Details:</span>
                <p className="text-xs text-[#3B2216] mt-0.5">{booking.destination_details}</p>
              </div>
            )}
          </div>
        </div>

        {/* Driver's License Photo (Private Storage) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#735340] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1AA3A3]" /> Driver's License Document
          </h3>
          {signedLicenseUrl ? (
            <div className="relative aspect-[16/9] max-w-sm rounded-2xl overflow-hidden border border-[#F0DFC8]">
              <Image
                src={signedLicenseUrl}
                alt="Renter Driver's License"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="p-3.5 bg-[#FFFBF5] border border-[#F0DFC8] rounded-2xl text-xs text-[#735340]">
              License will be presented on physical handover at pickup location.
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="space-y-2 pt-2 border-t border-[#F0DFC8]/60">
          <div className="bg-[#FFF4E6] p-4 rounded-2xl border border-[#F0DFC8] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#735340] block">Estimated Rental Total</span>
              <span className="text-2xl font-black text-[#E8772E]">
                {formatPHP(booking.estimated_total)}
              </span>
            </div>
            {booking.car?.security_deposit && (
              <div className="text-right">
                <span className="text-xs text-[#735340] block">Security Deposit (Separate)</span>
                <span className="text-sm font-bold text-[#3B2216]">
                  {formatPHP(booking.car.security_deposit)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#735340] text-center italic">
            "Final price and details are confirmed by the owner." Vulpi charges zero platform commission.
          </p>
        </div>

        {/* Action Buttons: Confirm, Decline, SMS, Call, PDF */}
        <div className="pt-4 border-t border-[#F0DFC8]/60">
          <RequestActionButtons
            bookingId={booking.id}
            currentStatus={booking.status}
            renterPhone={booking.renter_phone}
            renterName={booking.renter_name}
          />
        </div>
      </div>
    </div>
  );
}
