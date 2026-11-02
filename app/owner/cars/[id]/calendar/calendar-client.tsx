'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeBlockedDateAction } from '@/app/actions/owner-calendar';
import { BlockDateModal } from '@/components/owner/BlockDateModal';
import { formatDateRangePH } from '@/lib/formatters';
import { BLOCK_REASONS } from '@/lib/constants';
import { Plus, Trash2, Calendar, ShieldAlert } from 'lucide-react';

interface OwnerCalendarClientProps {
  car: any;
  initialBlockedDates: any[];
  initialBookings: any[];
}

export function OwnerCalendarClient({
  car,
  initialBlockedDates,
  initialBookings,
}: OwnerCalendarClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockedDates, setBlockedDates] = useState(initialBlockedDates);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleUnblock = async (blockId: string) => {
    if (!confirm('Are you sure you want to release these blocked dates?')) return;
    setIsDeleting(blockId);
    await removeBlockedDateAction(blockId, car.id);
    setBlockedDates(blockedDates.filter((b) => b.id !== blockId));
    setIsDeleting(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0DFC8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-base text-[#3B2216]">
            Availability Overrides & Blocks
          </h2>
          <p className="text-xs text-[#735340]">
            Need the car for personal errands, maintenance, or offline walk-ins? Block dates here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 rounded-full bg-[#E8772E] hover:bg-[#D4661E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Block Specific Dates
        </button>
      </div>

      {/* Two columns: Active Blocks list and Bookings list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blocked Dates List */}
        <div className="bg-white p-6 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <h3 className="font-black text-base text-[#3B2216] mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E8772E]" />
            Manual Blocked Dates ({blockedDates.length})
          </h3>

          {blockedDates.length === 0 ? (
            <p className="text-xs text-[#735340] py-4 italic">
              No manual blocks active. The car is available whenever not booked.
            </p>
          ) : (
            <div className="space-y-2.5">
              {blockedDates.map((block) => {
                const reasonLabel =
                  BLOCK_REASONS.find((r) => r.id === block.reason)?.label || block.reason;

                return (
                  <div
                    key={block.id}
                    className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#3B2216] block">
                        {formatDateRangePH(block.start_date, block.end_date)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#735340]">
                        {reasonLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isDeleting === block.id}
                      onClick={() => handleUnblock(block.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Unblock dates"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bookings Dates */}
        <div className="bg-white p-6 rounded-3xl border border-[#F0DFC8] shadow-sm">
          <h3 className="font-black text-base text-[#3B2216] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1AA3A3]" />
            Renter Bookings ({initialBookings.length})
          </h3>

          {initialBookings.length === 0 ? (
            <p className="text-xs text-[#735340] py-4 italic">
              No pending or confirmed renter bookings yet for this car.
            </p>
          ) : (
            <div className="space-y-2.5">
              {initialBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#F0DFC8] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-[#3B2216] block">
                      {formatDateRangePH(b.start_date, b.end_date)}
                    </span>
                    <span className="text-[11px] text-[#735340]">
                      Renter: <strong>{b.renter_name}</strong>
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status === 'confirmed' ? 'Confirmed' : 'Held (Pending)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BlockDateModal
        carId={car.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
