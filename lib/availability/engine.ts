export interface DateRange {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
}

export interface BookingHold {
  id: string;
  carId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'expired';
  holdExpiresAt?: string; // ISO date string
}

export interface BlockedDate {
  id: string;
  carId: string;
  startDate: string;
  endDate: string;
  reason: 'repairs' | 'personal' | 'offline_booking';
}

/**
 * Evaluates whether two inclusive date ranges [A, B] and [C, D] overlap.
 * Both start and end dates are inclusive.
 * Back-to-back (A..B and C..D where C = B + 1 day) do NOT overlap.
 * Same-day overlap (C = B) DOES overlap.
 */
export function doInclusiveRangesOverlap(rangeA: DateRange, rangeB: DateRange): boolean {
  return rangeA.startDate <= rangeB.endDate && rangeA.endDate >= rangeB.startDate;
}

/**
 * Pure availability evaluator used by both client/server algorithms and unit tests.
 */
export function evaluateAvailability(params: {
  carId: string;
  requestedRange: DateRange;
  existingBookings: BookingHold[];
  blockedDates: BlockedDate[];
  currentTime?: Date;
}): { isAvailable: boolean; conflictReason?: 'overlapping_booking' | 'blocked_maintenance' | 'pending_hold' } {
  const now = params.currentTime || new Date();
  const req = params.requestedRange;

  if (req.startDate > req.endDate) {
    return { isAvailable: false };
  }

  // 1. Check against active bookings
  for (const booking of params.existingBookings) {
    if (booking.carId !== params.carId) continue;

    // Check if pending hold has expired
    if (booking.status === 'pending') {
      const expiresAt = booking.holdExpiresAt ? new Date(booking.holdExpiresAt) : null;
      if (expiresAt && expiresAt <= now) {
        // Expired hold: does NOT block
        continue;
      }
    } else if (booking.status !== 'confirmed') {
      // Declined, cancelled, completed, expired do NOT block
      continue;
    }

    if (doInclusiveRangesOverlap(req, { startDate: booking.startDate, endDate: booking.endDate })) {
      return {
        isAvailable: false,
        conflictReason: booking.status === 'pending' ? 'pending_hold' : 'overlapping_booking',
      };
    }
  }

  // 2. Check against blocked dates (repairs, personal, offline)
  for (const block of params.blockedDates) {
    if (block.carId !== params.carId) continue;
    if (doInclusiveRangesOverlap(req, { startDate: block.startDate, endDate: block.endDate })) {
      return {
        isAvailable: false,
        conflictReason: 'blocked_maintenance',
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Simulates concurrent booking submission for the same car.
 * Returns which request succeeded and which failed with conflict.
 */
export async function simulateConcurrentRequests(
  carId: string,
  request1: { id: string; range: DateRange },
  request2: { id: string; range: DateRange },
  existingBookings: BookingHold[] = []
): Promise<{ req1Success: boolean; req2Success: boolean; conflictMessage?: string }> {
  // In-memory atomic store simulation mirroring Postgres serializable/exclusion lock
  const ledger = [...existingBookings];

  const tryBook = (req: { id: string; range: DateRange }) => {
    const check = evaluateAvailability({
      carId,
      requestedRange: req.range,
      existingBookings: ledger,
      blockedDates: [],
    });

    if (check.isAvailable) {
      ledger.push({
        id: req.id,
        carId,
        startDate: req.range.startDate,
        endDate: req.range.endDate,
        status: 'pending',
        holdExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });
      return true;
    }
    return false;
  };

  // Simulate both requests executing simultaneously
  const req1Success = tryBook(request1);
  const req2Success = tryBook(request2);

  return {
    req1Success,
    req2Success,
    conflictMessage: !req2Success ? 'Sorry, those dates were just taken' : undefined,
  };
}
