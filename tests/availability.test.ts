import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAvailability,
  doInclusiveRangesOverlap,
  simulateConcurrentRequests,
  BookingHold,
  BlockedDate,
} from '../lib/availability/engine';

describe('Vulpi Availability Engine & Conflict Rules', () => {
  const testCarId = 'car-vios-001';

  test('1. Overlapping ranges are correctly detected and rejected', () => {
    const existingBookings: BookingHold[] = [
      {
        id: 'b1',
        carId: testCarId,
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        status: 'confirmed',
      },
    ];

    // Case A: Partial overlap at start (Nov 08 - Nov 11)
    const resA = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-08', endDate: '2026-11-11' },
      existingBookings,
      blockedDates: [],
    });
    assert.equal(resA.isAvailable, false);
    assert.equal(resA.conflictReason, 'overlapping_booking');

    // Case B: Completely inside (Nov 12 - Nov 14)
    const resB = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-12', endDate: '2026-11-14' },
      existingBookings,
      blockedDates: [],
    });
    assert.equal(resB.isAvailable, false);

    // Case C: Same-day overlap (starts on Nov 15)
    const resC = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-15', endDate: '2026-11-18' },
      existingBookings,
      blockedDates: [],
    });
    assert.equal(resC.isAvailable, false, 'Same-day overlap must be rejected');
  });

  test('2. Back-to-back bookings (one ends the day before another starts) are allowed', () => {
    const existingBookings: BookingHold[] = [
      {
        id: 'b1',
        carId: testCarId,
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        status: 'confirmed',
      },
      {
        id: 'b2',
        carId: testCarId,
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        status: 'confirmed',
      },
    ];

    // Rental starts Nov 06 (day after b1 ends on Nov 05) and ends Nov 09 (day before b2 starts on Nov 10)
    const res = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-06', endDate: '2026-11-09' },
      existingBookings,
      blockedDates: [],
    });

    assert.equal(res.isAvailable, true, 'Back-to-back rental must be available');
  });

  test('3. A range spanning a blocked date is rejected', () => {
    const blockedDates: BlockedDate[] = [
      {
        id: 'blk-1',
        carId: testCarId,
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        reason: 'repairs',
      },
    ];

    const res = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-18', endDate: '2026-11-25' },
      existingBookings: [],
      blockedDates,
    });

    assert.equal(res.isAvailable, false);
    assert.equal(res.conflictReason, 'blocked_maintenance');
  });

  test('4. An expired 24-hour hold releases dates for new requests', () => {
    const now = new Date('2026-11-10T15:00:00Z');

    // Hold that expired 2 hours ago (Nov 10 13:00)
    const expiredBooking: BookingHold = {
      id: 'expired-1',
      carId: testCarId,
      startDate: '2026-11-12',
      endDate: '2026-11-16',
      status: 'pending',
      holdExpiresAt: '2026-11-10T13:00:00Z',
    };

    // Active hold that expires tomorrow (Nov 11 13:00)
    const activeBooking: BookingHold = {
      id: 'active-1',
      carId: testCarId,
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      status: 'pending',
      holdExpiresAt: '2026-11-11T13:00:00Z',
    };

    // Attempt to book the dates from the expired hold
    const resExpired = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-12', endDate: '2026-11-16' },
      existingBookings: [expiredBooking],
      blockedDates: [],
      currentTime: now,
    });
    assert.equal(resExpired.isAvailable, true, 'Expired hold must release dates');

    // Attempt to book the dates from the active hold
    const resActive = evaluateAvailability({
      carId: testCarId,
      requestedRange: { startDate: '2026-11-20', endDate: '2026-11-22' },
      existingBookings: [activeBooking],
      blockedDates: [],
      currentTime: now,
    });
    assert.equal(resActive.isAvailable, false, 'Unexpired pending hold must block dates');
  });

  test('5. Two simultaneous requests for the same car: first succeeds, second fails with conflict message', async () => {
    const request1 = {
      id: 'req-first',
      range: { startDate: '2026-12-01', endDate: '2026-12-05' },
    };
    const request2 = {
      id: 'req-second',
      range: { startDate: '2026-12-03', endDate: '2026-12-07' }, // overlapping
    };

    const outcome = await simulateConcurrentRequests(testCarId, request1, request2);

    assert.equal(outcome.req1Success, true, 'First request must succeed');
    assert.equal(outcome.req2Success, false, 'Second conflicting request must fail');
    assert.equal(outcome.conflictMessage, 'Sorry, those dates were just taken');
  });
});
