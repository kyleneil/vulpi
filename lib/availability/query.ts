import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CarWithOwner } from '@/types';
import { CarType, DestinationType } from '@/types/database';
import { addDays, subDays, format, parseISO, isBefore } from 'date-fns';

/**
 * Ensures any pending booking whose 24-hour hold expired is marked as 'expired'.
 * Runs safely at query time so the availability view is always 100% current.
 */
export async function expireStaleHolds(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('hold_expires_at', nowIso)
      .select('id');

    if (error) {
      // Don't clutter console if tables haven't been migrated yet
      if (error.message && !error.message.includes('relation "public.bookings" does not exist')) {
        console.warn('[expireStaleHolds] notice:', error.message);
      }
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Checks if a specific car is available for the given inclusive date range.
 */
export async function checkCarAvailability(
  carId: string,
  startDate: string,
  endDate: string
): Promise<{ isAvailable: boolean; conflictReason?: string }> {
  await expireStaleHolds();

  try {
    const supabase = await createClient();

    // 1. Check for overlapping active bookings (confirmed or active pending hold)
    const { data: conflictingBookings, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, status, hold_expires_at, start_date, end_date')
      .eq('car_id', carId)
      .in('status', ['confirmed', 'pending'])
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (!bookingErr && conflictingBookings) {
      const now = new Date();
      const validConflict = (conflictingBookings as any[])?.find((b: any) => {
        if (b.status === 'confirmed') return true;
        if (b.status === 'pending' && b.hold_expires_at) {
          return new Date(b.hold_expires_at) > now;
        }
        return false;
      });

      if (validConflict) {
        return {
          isAvailable: false,
          conflictReason: validConflict.status === 'confirmed' ? 'booked_confirmed' : 'booked_pending',
        };
      }
    }

    // 2. Check for overlapping blocked dates (maintenance / personal / offline)
    const { data: conflictingBlocks, error: blockErr } = await supabase
      .from('blocked_dates')
      .select('id, reason, start_date, end_date')
      .eq('car_id', carId)
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (!blockErr && conflictingBlocks && conflictingBlocks.length > 0) {
      return {
        isAvailable: false,
        conflictReason: 'blocked',
      };
    }
  } catch {
    // Graceful fallback
  }

  return { isAvailable: true };
}

/**
 * Search cars that are active and strictly free for the requested date range.
 */
export async function searchAvailableCars(params: {
  startDate?: string;
  endDate?: string;
  carType?: string;
  destination?: DestinationType;
  transmission?: string;
  seats?: number;
  sortBy?: 'price_asc' | 'price_desc';
}): Promise<CarWithOwner[]> {
  await expireStaleHolds();

  let liveCars: CarWithOwner[] | null = null;

  try {
    const supabase = await createClient();

    let query = supabase
      .from('cars')
      .select('*, owner:owners(*)')
      .eq('is_active', true);

    if (params.carType && params.carType !== 'all') {
      query = query.eq('car_type', params.carType as CarType);
    }

    if (params.transmission && params.transmission !== 'all') {
      query = query.eq('transmission', params.transmission);
    }

    if (params.seats && params.seats > 0) {
      query = query.gte('seats', params.seats);
    }

    const { data: cars, error } = await query;

    if (!error && cars && cars.length > 0) {
      liveCars = cars as unknown as CarWithOwner[];
    } else if (error && error.message) {
      console.info(
        `[Vulpi Database Notice] ${error.message}. (Run supabase/migrations/20261031000000_initial_schema.sql in your Supabase SQL Editor to populate live database)`
      );
    }
  } catch (err) {
    // Return empty live cars
  }

  const baseCars = liveCars || [];

  // If no dates specified, return all active cars sorted
  if (!params.startDate || !params.endDate) {
    return sortCars(baseCars, params.sortBy, params.destination);
  }

  const { startDate, endDate } = params;

  // Filter against active conflicting bookings if database is live
  try {
    const supabase = await createClient();
    const { data: bookedCars, error: bookedErr } = await supabase
      .from('bookings')
      .select('car_id, status, hold_expires_at')
      .in('status', ['confirmed', 'pending'])
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (!bookedErr && bookedCars) {
      const now = new Date();
      const unavailableCarIds = new Set<string>();

      (bookedCars as any[])?.forEach((b: any) => {
        if (b.status === 'confirmed') {
          unavailableCarIds.add(b.car_id);
        } else if (b.status === 'pending' && b.hold_expires_at && new Date(b.hold_expires_at) > now) {
          unavailableCarIds.add(b.car_id);
        }
      });

      const { data: blockedCars } = await supabase
        .from('blocked_dates')
        .select('car_id')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      (blockedCars as any[])?.forEach((b: any) => {
        unavailableCarIds.add(b.car_id);
      });

      const available = baseCars.filter((car) => !unavailableCarIds.has(car.id));
      return sortCars(available, params.sortBy, params.destination);
    }
  } catch {
    // Return base cars
  }

  return sortCars(baseCars, params.sortBy, params.destination);
}

function sortCars(cars: CarWithOwner[], sortBy?: string, destination?: DestinationType): CarWithOwner[] {
  return [...cars].sort((a, b) => {
    const rateA = destination === 'outside_cdo' ? (a.daily_rate_out_of_city ?? a.daily_rate_in_city) : a.daily_rate_in_city;
    const rateB = destination === 'outside_cdo' ? (b.daily_rate_out_of_city ?? b.daily_rate_in_city) : b.daily_rate_in_city;

    if (sortBy === 'price_desc') {
      return rateB - rateA;
    }
    return rateA - rateB;
  });
}

/**
 * Finds the nearest alternate date windows when cars of a requested type are free.
 */
export async function findNearestAvailableDates(
  carType: CarType,
  requestedStartDate: string,
  requestedEndDate: string
): Promise<{
  before?: { start: string; end: string; carCount: number };
  after?: { start: string; end: string; carCount: number };
}> {
  const start = parseISO(requestedStartDate);
  const end = parseISO(requestedEndDate);

  let afterMatch: { start: string; end: string; carCount: number } | undefined;
  let beforeMatch: { start: string; end: string; carCount: number } | undefined;

  for (let shift = 1; shift <= 14; shift++) {
    const candidateStart = format(addDays(start, shift), 'yyyy-MM-dd');
    const candidateEnd = format(addDays(end, shift), 'yyyy-MM-dd');
    const freeCars = await searchAvailableCars({
      startDate: candidateStart,
      endDate: candidateEnd,
      carType,
    });
    if (freeCars.length > 0) {
      afterMatch = { start: candidateStart, end: candidateEnd, carCount: freeCars.length };
      break;
    }
  }

  const today = new Date();
  for (let shift = 1; shift <= 14; shift++) {
    const candStartDate = subDays(start, shift);
    if (isBefore(candStartDate, today)) {
      break;
    }
    const candidateStart = format(candStartDate, 'yyyy-MM-dd');
    const candidateEnd = format(subDays(end, shift), 'yyyy-MM-dd');
    const freeCars = await searchAvailableCars({
      startDate: candidateStart,
      endDate: candidateEnd,
      carType,
    });
    if (freeCars.length > 0) {
      beforeMatch = { start: candidateStart, end: candidateEnd, carCount: freeCars.length };
      break;
    }
  }

  return { before: beforeMatch, after: afterMatch };
}
