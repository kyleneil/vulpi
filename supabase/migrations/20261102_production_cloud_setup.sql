-- ==============================================================================
-- Vulpi — Smart Rentals CDO (Production Database Architecture)
-- Target: Supabase PostgreSQL (with Supavisor Connection Pooler & Zero Egress R2)
-- Migration: 20261102_production_cloud_setup.sql
-- ==============================================================================

-- 1. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE car_category_enum AS ENUM ('sedan', 'suv', 'van', 'pickup', 'compact');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transmission_enum AS ENUM ('automatic', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fuel_type_enum AS ENUM ('gasoline', 'diesel', 'hybrid', 'electric');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE destination_type_enum AS ENUM ('within_cdo', 'outside_cdo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE block_reason_enum AS ENUM ('maintenance', 'offline', 'personal_use', 'booked_offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. OWNERS TABLE
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  location_cdo TEXT NOT NULL DEFAULT 'Cagayan de Oro City',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  custom_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_owner_user_id UNIQUE(user_id)
);

-- 4. CARS TABLE
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2010 AND year <= 2030),
  category car_category_enum NOT NULL,
  seats INTEGER NOT NULL CHECK (seats >= 2 AND seats <= 20),
  transmission transmission_enum NOT NULL,
  fuel_type fuel_type_enum NOT NULL,
  plate_number TEXT NOT NULL,
  daily_rate_in_city NUMERIC(10, 2) NOT NULL CHECK (daily_rate_in_city > 0),
  daily_rate_out_of_city NUMERIC(10, 2) CHECK (daily_rate_out_of_city >= daily_rate_in_city),
  driver_available BOOLEAN NOT NULL DEFAULT false,
  driver_fee NUMERIC(10, 2) DEFAULT 0 CHECK (driver_fee >= 0),
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 3000 CHECK (security_deposit >= 0),
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  pickup_location TEXT NOT NULL DEFAULT 'Cagayan de Oro City Proper / Laguindingan Airport',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_plate_number UNIQUE(plate_number)
);

-- 5. BLOCKED DATES TABLE (Maintenance / Offline Holds)
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason block_reason_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_block_date_range CHECK (end_date >= start_date)
);

-- Ensure exclusion constraint exists on blocked_dates
DO $$ BEGIN
  ALTER TABLE public.blocked_dates
    ADD CONSTRAINT no_overlapping_blocks EXCLUDE USING gist (
      car_id WITH =,
      daterange(start_date, end_date, '[]') WITH &&
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 6. BOOKINGS TABLE (With Anti-Double-Booking PostgreSQL Exclusion Constraint)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  renter_name TEXT NOT NULL,
  renter_phone TEXT NOT NULL,
  renter_email TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  destination_type destination_type_enum NOT NULL,
  destination_details TEXT,
  with_driver BOOLEAN NOT NULL DEFAULT false,
  estimated_total NUMERIC(10, 2) NOT NULL CHECK (estimated_total >= 0),
  status booking_status_enum NOT NULL DEFAULT 'pending',
  hold_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  license_photo_path TEXT,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  owner_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_booking_dates CHECK (end_date >= start_date)
);

-- Ensure strict anti-double-booking exclusion constraint exists on bookings
DO $$ BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
      car_id WITH =,
      daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (status IN ('pending', 'confirmed'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 7. CROSS-TABLE AVAILABILITY INTEGRITY TRIGGERS
CREATE OR REPLACE FUNCTION public.check_booking_against_blocked_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('pending', 'confirmed') THEN
    IF EXISTS (
      SELECT 1 FROM public.blocked_dates
      WHERE car_id = NEW.car_id
        AND daterange(start_date, end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
    ) THEN
      RAISE EXCEPTION 'Requested dates overlap with a blocked maintenance or offline period for this car.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_booking_blocked ON public.bookings;
CREATE TRIGGER trg_check_booking_blocked
BEFORE INSERT OR UPDATE OF start_date, end_date, status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.check_booking_against_blocked_dates();

CREATE OR REPLACE FUNCTION public.check_blocked_dates_against_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE car_id = NEW.car_id
      AND status IN ('pending', 'confirmed')
      AND (status = 'confirmed' OR hold_expires_at > NOW())
      AND daterange(start_date, end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
  ) THEN
    RAISE EXCEPTION 'Cannot block dates: An active or confirmed booking already exists for this timeframe.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_blocked_booking ON public.blocked_dates;
CREATE TRIGGER trg_check_blocked_booking
BEFORE INSERT OR UPDATE OF start_date, end_date ON public.blocked_dates
FOR EACH ROW EXECUTE FUNCTION public.check_blocked_dates_against_bookings();

-- 8. AUTO-EXPIRE 24-HOUR STALE HOLDS STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.expire_stale_holds()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.bookings
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND hold_expires_at <= NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cars_owner ON public.cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_active ON public.cars(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_car_dates ON public.bookings(car_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_hold ON public.bookings(hold_expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_blocked_dates_car ON public.blocked_dates(car_id);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Public read active car owners" ON public.owners;
DROP POLICY IF EXISTS "Owners can manage own profile" ON public.owners;
DROP POLICY IF EXISTS "Public can view active cars" ON public.cars;
DROP POLICY IF EXISTS "Owners can manage own cars" ON public.cars;
DROP POLICY IF EXISTS "Public can view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Owners can manage blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Renters can create booking requests" ON public.bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their cars" ON public.bookings;
DROP POLICY IF EXISTS "Owners can update bookings for their cars" ON public.bookings;

-- Owners policies
CREATE POLICY "Public read active car owners"
  ON public.owners FOR SELECT
  USING (
    is_verified = true
    OR EXISTS (SELECT 1 FROM public.cars WHERE cars.owner_id = owners.id AND cars.is_active = true)
    OR auth.uid() = user_id
  );

CREATE POLICY "Owners can manage own profile"
  ON public.owners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cars policies
CREATE POLICY "Public can view active cars"
  ON public.cars FOR SELECT
  USING (is_active = true OR owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "Owners can manage own cars"
  ON public.cars FOR ALL
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()))
  WITH CHECK (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Blocked dates policies
CREATE POLICY "Public can view blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.cars WHERE cars.id = blocked_dates.car_id AND (cars.is_active = true OR cars.owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()))));

CREATE POLICY "Owners can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (car_id IN (
    SELECT cars.id FROM public.cars
    JOIN public.owners ON cars.owner_id = owners.id
    WHERE owners.user_id = auth.uid()
  ))
  WITH CHECK (car_id IN (
    SELECT cars.id FROM public.cars
    JOIN public.owners ON cars.owner_id = owners.id
    WHERE owners.user_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "Renters can create booking requests"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can view bookings for their cars"
  ON public.bookings FOR SELECT
  USING (car_id IN (
    SELECT cars.id FROM public.cars
    JOIN public.owners ON cars.owner_id = owners.id
    WHERE owners.user_id = auth.uid()
  ));

CREATE POLICY "Owners can update bookings for their cars"
  ON public.bookings FOR UPDATE
  USING (car_id IN (
    SELECT cars.id FROM public.cars
    JOIN public.owners ON cars.owner_id = owners.id
    WHERE owners.user_id = auth.uid()
  ))
  WITH CHECK (car_id IN (
    SELECT cars.id FROM public.cars
    JOIN public.owners ON cars.owner_id = owners.id
    WHERE owners.user_id = auth.uid()
  ));

-- ==============================================================================
-- CONNECTION POOLING CONFIGURATION (Supavisor):
--
-- For Serverless Next.js API Routes / Cloudflare Workers:
-- Transaction Mode: Port 6543
-- postgres://[user].[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
--
-- For Direct CLI Migrations / Schema Sync:
-- Session Mode: Port 5432
-- postgres://[user].[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
-- ==============================================================================
