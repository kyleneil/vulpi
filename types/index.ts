import { Database, CarType, TransmissionType, FuelType, DestinationType, BookingStatus, BlockReason } from './database';

export type OwnerRow = Database['public']['Tables']['owners']['Row'];
export type CarRow = Database['public']['Tables']['cars']['Row'];
export type BlockedDateRow = Database['public']['Tables']['blocked_dates']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];

export interface CarWithOwner extends CarRow {
  owner: OwnerRow;
}

export interface BookingWithCarAndOwner extends BookingRow {
  car: CarRow & {
    owner: OwnerRow;
  };
}

export interface SearchParams {
  startDate?: string;
  endDate?: string;
  carType?: CarType | 'all';
  destination?: DestinationType;
  transmission?: TransmissionType | 'all';
  seats?: number | 'all';
  sortBy?: 'price_asc' | 'price_desc';
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  conflictReason?: 'blocked' | 'booked_pending' | 'booked_confirmed';
  nearestAlternativeDates?: {
    before?: { start: string; end: string };
    after?: { start: string; end: string };
  };
}
