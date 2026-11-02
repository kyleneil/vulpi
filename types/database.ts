export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CarType = 'sedan' | 'hatchback' | 'suv' | 'mpv' | 'van' | 'pickup';
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type DestinationType = 'within_cdo' | 'outside_cdo';
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'expired';
export type BlockReason = 'repairs' | 'personal' | 'offline_booking';

export interface Database {
  public: {
    Tables: {
      owners: {
        Row: {
          id: string;
          user_id: string;
          name_or_business: string;
          phone: string;
          email: string;
          messenger_link: string | null;
          pickup_location: string;
          terms_text: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name_or_business: string;
          phone: string;
          email: string;
          messenger_link?: string | null;
          pickup_location: string;
          terms_text?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name_or_business?: string;
          phone?: string;
          email?: string;
          messenger_link?: string | null;
          pickup_location?: string;
          terms_text?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cars: {
        Row: {
          id: string;
          owner_id: string;
          make: string;
          model: string;
          year: number;
          plate_number: string | null;
          car_type: CarType;
          transmission: TransmissionType;
          seats: number;
          fuel_type: FuelType;
          photos: string[];
          daily_rate_in_city: number;
          daily_rate_out_of_city: number | null;
          driver_available: boolean;
          driver_fee: number | null;
          security_deposit: number | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          make: string;
          model: string;
          year: number;
          plate_number?: string | null;
          car_type: CarType;
          transmission: TransmissionType;
          seats: number;
          fuel_type?: FuelType;
          photos?: string[];
          daily_rate_in_city: number;
          daily_rate_out_of_city?: number | null;
          driver_available?: boolean;
          driver_fee?: number | null;
          security_deposit?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          make?: string;
          model?: string;
          year?: number;
          plate_number?: string | null;
          car_type?: CarType;
          transmission?: TransmissionType;
          seats?: number;
          fuel_type?: FuelType;
          photos?: string[];
          daily_rate_in_city?: number;
          daily_rate_out_of_city?: number | null;
          driver_available?: boolean;
          driver_fee?: number | null;
          security_deposit?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      blocked_dates: {
        Row: {
          id: string;
          car_id: string;
          start_date: string;
          end_date: string;
          reason: BlockReason;
          created_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          start_date: string;
          end_date: string;
          reason: BlockReason;
          created_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: BlockReason;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          car_id: string;
          renter_name: string;
          renter_phone: string;
          renter_email: string | null;
          start_date: string;
          end_date: string;
          destination_type: DestinationType;
          destination_details: string | null;
          with_driver: boolean;
          estimated_total: number;
          status: BookingStatus;
          hold_expires_at: string;
          license_photo_path: string | null;
          terms_accepted_at: string;
          owner_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          car_id: string;
          renter_name: string;
          renter_phone: string;
          renter_email?: string | null;
          start_date: string;
          end_date: string;
          destination_type: DestinationType;
          destination_details?: string | null;
          with_driver?: boolean;
          estimated_total: number;
          status?: BookingStatus;
          hold_expires_at?: string;
          license_photo_path?: string | null;
          terms_accepted_at?: string;
          owner_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          car_id?: string;
          renter_name?: string;
          renter_phone?: string;
          renter_email?: string | null;
          start_date?: string;
          end_date?: string;
          destination_type?: DestinationType;
          destination_details?: string | null;
          with_driver?: boolean;
          estimated_total?: number;
          status?: BookingStatus;
          hold_expires_at?: string;
          license_photo_path?: string | null;
          terms_accepted_at?: string;
          owner_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      expire_stale_holds: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      is_car_available: {
        Args: {
          p_car_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: boolean;
      };
    };
  };
}
