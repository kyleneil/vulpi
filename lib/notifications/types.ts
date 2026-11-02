export interface BookingNotificationPayload {
  bookingId: string;
  carMake: string;
  carModel: string;
  carYear: number;
  renterName: string;
  renterPhone: string;
  renterEmail?: string | null;
  startDate: string;
  endDate: string;
  destination: string;
  estimatedTotal: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  holdExpiresAt: string;
}

export interface HoldExpiringNotificationPayload {
  bookingId: string;
  carMake: string;
  carModel: string;
  renterName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  hoursRemaining: number;
}

export interface StatusUpdatedNotificationPayload {
  bookingId: string;
  carMake: string;
  carModel: string;
  renterName: string;
  renterEmail?: string | null;
  renterPhone: string;
  status: 'confirmed' | 'declined' | 'cancelled';
  ownerName: string;
  ownerPhone: string;
  ownerNote?: string | null;
  pickupLocation: string;
}
