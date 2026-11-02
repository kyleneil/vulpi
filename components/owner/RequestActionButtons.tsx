'use client';

import { useState } from 'react';
import { updateBookingStatusAction } from '@/app/actions/bookings';
import { BookingStatus } from '@/types/database';
import { Phone, MessageSquare, Check, X, CheckCheck, Ban, FileDown } from 'lucide-react';

interface RequestActionButtonsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  renterPhone: string;
  renterName: string;
}

export function RequestActionButtons({
  bookingId,
  currentStatus,
  renterPhone,
  renterName,
}: RequestActionButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const cleanPhone = renterPhone.replace(/\s+/g, '');
  const smsBody = encodeURIComponent(`Hi ${renterName}! This is regarding your car rental request on Vulpi.`);

  const handleStatusChange = async (status: BookingStatus, note?: string) => {
    setIsUpdating(true);
    await updateBookingStatusAction(bookingId, status, note);
    setIsUpdating(false);
    setShowDeclineModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Direct communication buttons (Click-to-call & Click-to-SMS) */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${cleanPhone}`}
          className="h-12 rounded-2xl bg-[#1AA3A3] hover:bg-[#0F7F82] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Phone className="w-4 h-4" />
          Call Renter
        </a>
        <a
          href={`sms:${cleanPhone}?body=${smsBody}`}
          className="h-12 rounded-2xl bg-[#FAF0E4] hover:bg-[#F0DFC8] border border-[#F0DFC8] text-[#3B2216] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <MessageSquare className="w-4 h-4 text-[#E8772E]" />
          SMS Renter
        </a>
      </div>

      {/* Booking State Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0DFC8]/60">
        {currentStatus === 'pending' && (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange('confirmed')}
              className="flex-1 h-12 rounded-2xl bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Confirm Booking
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setShowDeclineModal(true)}
              className="h-12 px-5 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </>
        )}

        {currentStatus === 'confirmed' && (
          <>
            <a
              href={`/api/agreements/${bookingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 rounded-2xl bg-[#1AA3A3] hover:bg-[#0F7F82] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <FileDown className="w-4 h-4" />
              Generate Printable Agreement (PDF)
            </a>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange('completed')}
              className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark Completed
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange('cancelled', 'Cancelled by owner')}
              className="h-12 px-4 rounded-2xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Decline Note Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-[#3B2216]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#F0DFC8]">
            <h4 className="font-bold text-lg text-[#3B2216]">Decline Booking Request</h4>
            <p className="text-xs text-[#735340] mt-1">
              Optionally provide a reason why you are unable to accept this request.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Vehicle scheduled for servicing, or driver unavailable."
              rows={3}
              className="w-full mt-3 p-3 rounded-xl border border-[#F0DFC8] bg-[#FFFBF5] text-xs text-[#3B2216] focus:outline-none focus:ring-2 focus:ring-[#E8772E]"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 h-10 rounded-xl border border-[#F0DFC8] text-xs font-bold text-[#735340]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('declined', declineReason)}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
