'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBookingRequestAction } from '@/app/actions/bookings';
import { formatPHP, calculateRentalDays, formatDateRangePH } from '@/lib/formatters';
import { POPULAR_CDO_DESTINATIONS } from '@/lib/constants';
import { DestinationType } from '@/types/database';
import {
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  UploadCloud,
  AlertCircle,
  X,
  Send,
  Lock,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { DateRangePicker, DisabledDateRange } from '@/components/renter/DateRangePicker';

interface RequestFormClientProps {
  car: any;
  initialStartDate?: string;
  initialEndDate?: string;
  initialDestination?: string;
  ownerTerms: string;
  disabledRanges?: DisabledDateRange[];
}

export function RequestFormClient({
  car,
  initialStartDate,
  initialEndDate,
  initialDestination = 'within_cdo',
  ownerTerms,
  disabledRanges = [],
}: RequestFormClientProps) {
  const router = useRouter();

  const defaultStart = initialStartDate || '';
  const defaultEnd = initialEndDate || '';

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [destinationType, setDestinationType] = useState<DestinationType>(
    (initialDestination as DestinationType) || 'within_cdo'
  );
  const [withDriver, setWithDriver] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live price calculations
  const hasDates = Boolean(startDate && endDate);
  const days = hasDates ? calculateRentalDays(startDate, endDate) : 1;
  const dailyRate =
    destinationType === 'outside_cdo' && car.daily_rate_out_of_city
      ? car.daily_rate_out_of_city
      : car.daily_rate_in_city;

  const driverRate = withDriver && car.driver_fee ? car.driver_fee : 0;
  const estimatedTotal = (dailyRate + driverRate) * days;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMessage('Please select your pickup and return dates.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please agree to the owner’s rental terms and conditions to proceed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    formData.set('car_id', car.id);
    formData.set('start_date', startDate);
    formData.set('end_date', endDate);
    formData.set('destination_type', destinationType);
    formData.set('with_driver', String(withDriver));
    formData.set('terms_accepted', String(termsAccepted));

    const res = await createBookingRequestAction(formData);
    setIsSubmitting(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else if (res?.bookingId) {
      router.push(`/request-confirmation/${res.bookingId}`);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0DFC8] shadow-sm space-y-6">
        {/* Dates & Destination */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-[#3B2216] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E8772E]" /> Rental Dates & Route
          </h3>

          <div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              disabledRanges={disabledRanges}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
              Destination / Travel Area
            </label>
            <select
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value as DestinationType)}
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216] focus:ring-2 focus:ring-[#E8772E]"
            >
              {POPULAR_CDO_DESTINATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label} — {d.hint}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
              Destination Details (Optional)
            </label>
            <input
              type="text"
              name="destination_details"
              placeholder="e.g. Airport arrival, staying at Seda Centrio, day trip to Dahilayan"
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>

          {/* With Driver Option */}
          {car.driver_available && (
            <div className="bg-[#FFFBF5] p-4 rounded-2xl border border-[#F0DFC8]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withDriver}
                  onChange={(e) => setWithDriver(e.target.checked)}
                  className="w-5 h-5 rounded text-[#1AA3A3] accent-[#1AA3A3]"
                />
                <span className="text-sm font-bold text-[#3B2216]">
                  Request Professional Driver (+{formatPHP(car.driver_fee)}/day)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Renter Contact Info */}
        <div className="space-y-4 pt-4 border-t border-[#F0DFC8]/60">
          <h3 className="font-bold text-base text-[#3B2216] flex items-center gap-2">
            <User className="w-4 h-4 text-[#1AA3A3]" /> Your Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="renter_name"
                required
                placeholder="e.g. Maria Santos"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
                Mobile Phone (+63) *
              </label>
              <input
                type="tel"
                name="renter_phone"
                required
                placeholder="0917 123 4567"
                className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#735340] mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="renter_email"
              placeholder="renter@example.ph"
              className="w-full h-12 px-3.5 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-sm text-[#3B2216]"
            />
          </div>
        </div>

        {/* Optional Driver's License Upload */}
        <div className="space-y-2 pt-4 border-t border-[#F0DFC8]/60">
          <label className="block text-xs font-bold uppercase text-[#735340]">
            Driver's License Photo (Optional)
          </label>
          <p className="text-xs text-[#735340]">
            Upload now for faster verification, or simply present it upon physical handover.
          </p>
          <div className="relative border-2 border-dashed border-[#F0DFC8] rounded-2xl p-4 bg-[#FFFBF5] hover:border-[#1AA3A3] transition-colors flex items-center gap-3">
            <UploadCloud className="w-6 h-6 text-[#1AA3A3] shrink-0" />
            <input
              type="file"
              name="license_photo"
              accept="image/*"
              className="text-xs text-[#735340] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1AA3A3] file:text-white cursor-pointer"
            />
          </div>
        </div>

        {/* Live Estimated Total Breakdown */}
        <div className="bg-[#FFF4E6] p-5 rounded-2xl border border-[#F0DFC8] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#735340]">
            <span>Daily Rate ({destinationType === 'outside_cdo' ? 'Outside CDO' : 'Within CDO'}):</span>
            <span className="font-bold text-[#3B2216]">{formatPHP(dailyRate)}/day</span>
          </div>
          {withDriver && car.driver_fee && (
            <div className="flex items-center justify-between text-xs text-[#735340]">
              <span>Driver Service:</span>
              <span className="font-bold text-[#1AA3A3]">+{formatPHP(car.driver_fee)}/day</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-[#735340]">
            <span>Rental Duration:</span>
            <span className="font-bold text-[#3B2216]">{days} {days === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#F0DFC8] text-base">
            <span className="font-bold text-[#3B2216]">Estimated Total:</span>
            <span className="font-black text-2xl text-[#E8772E]">{formatPHP(estimatedTotal)}</span>
          </div>
          {car.security_deposit && (
            <div className="flex items-center justify-between pt-1 text-xs text-[#735340]">
              <span>Refundable Security Deposit (Paid at pickup):</span>
              <span className="font-bold text-[#3B2216]">{formatPHP(car.security_deposit)}</span>
            </div>
          )}
          <p className="text-[11px] text-[#735340] italic pt-1">
            "Final price and details are confirmed by the owner."
          </p>
        </div>

        {/* Required Terms Checkbox */}
        <div className="pt-2 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              className="mt-0.5 w-5 h-5 rounded text-[#E8772E] accent-[#E8772E] cursor-pointer"
            />
            <span className="text-xs text-[#3B2216] leading-relaxed">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="font-bold text-[#E8772E] underline underline-offset-2"
              >
                owner’s rental terms and conditions
              </button>
              .
            </span>
          </label>

          {/* Privacy Notice */}
          <div className="p-3.5 bg-[#FFFBF5] rounded-xl border border-[#F0DFC8] flex items-start gap-2.5 text-[11px] text-[#735340] leading-relaxed">
            <Lock className="w-4 h-4 text-[#1AA3A3] shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Notice:</strong> Your name, phone number, and driver's license photo are encrypted and shared strictly with the vehicle owner for the purpose of this rental.
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#E8772E]/25 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Sending Request...' : 'Send Booking Request (Hold for 24h)'}
          </button>
        </div>
      </form>

      {/* Owner Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-[#3B2216]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col p-6 shadow-2xl border border-[#F0DFC8] relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0DFC8]">
              <h3 className="font-black text-lg text-[#3B2216] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E8772E]" /> Owner's Terms & Conditions
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF0E4] text-[#3B2216] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto text-xs font-mono text-[#3B2216] whitespace-pre-wrap leading-relaxed">
              {ownerTerms}
            </div>

            <div className="pt-3 border-t border-[#F0DFC8]">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="w-full h-11 rounded-full bg-[#E8772E] text-white font-bold text-xs"
              >
                I Understand & Agree to These Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
