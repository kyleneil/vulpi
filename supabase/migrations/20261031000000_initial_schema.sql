-- ====================================================================
-- Vulpi — Car Rental Marketplace (Cagayan de Oro)
-- Initial Schema Migration
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE car_type_enum AS ENUM ('sedan', 'hatchback', 'suv', 'mpv', 'van', 'pickup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transmission_enum AS ENUM ('automatic', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fuel_type_enum AS ENUM ('gasoline', 'diesel', 'hybrid', 'electric');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE destination_type_enum AS ENUM ('within_cdo', 'outside_cdo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE block_reason_enum AS ENUM ('repairs', 'personal', 'offline_booking');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. OWNERS TABLE
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name_or_business TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  messenger_link TEXT,
  pickup_location TEXT NOT NULL,
  terms_text TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CARS TABLE
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2030),
  plate_number TEXT,
  car_type car_type_enum NOT NULL,
  transmission transmission_enum NOT NULL,
  seats INTEGER NOT NULL CHECK (seats >= 2 AND seats <= 20),
  fuel_type fuel_type_enum NOT NULL DEFAULT 'gasoline',
  photos TEXT[] NOT NULL DEFAULT '{}',
  daily_rate_in_city NUMERIC(10, 2) NOT NULL CHECK (daily_rate_in_city > 0),
  daily_rate_out_of_city NUMERIC(10, 2) CHECK (daily_rate_out_of_city IS NULL OR daily_rate_out_of_city > 0),
  driver_available BOOLEAN NOT NULL DEFAULT false,
  driver_fee NUMERIC(10, 2) CHECK (driver_fee IS NULL OR driver_fee >= 0),
  security_deposit NUMERIC(10, 2) CHECK (security_deposit IS NULL OR security_deposit >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BLOCKED DATES TABLE
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason block_reason_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_block_date_range CHECK (end_date >= start_date),
  CONSTRAINT no_overlapping_blocks EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);

-- 6. BOOKINGS TABLE
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
  CONSTRAINT valid_booking_dates CHECK (end_date >= start_date),
  CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);

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
    RAISE EXCEPTION 'Cannot block dates because there is an active (pending or confirmed) booking in this range.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_blocked_booking ON public.blocked_dates;
CREATE TRIGGER trg_check_blocked_booking
BEFORE INSERT OR UPDATE OF start_date, end_date ON public.blocked_dates
FOR EACH ROW EXECUTE FUNCTION public.check_blocked_dates_against_bookings();

-- 8. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_owners_updated_at ON public.owners;
CREATE TRIGGER trg_owners_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cars_updated_at ON public.cars;
CREATE TRIGGER trg_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. AVAILABILITY HELPER & EXPIRY FUNCTIONS
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

CREATE OR REPLACE FUNCTION public.is_car_available(
  p_car_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_req_range DATERANGE := daterange(p_start_date, p_end_date, '[]');
BEGIN
  -- 1. Expire stale pending holds first to release dates immediately
  PERFORM public.expire_stale_holds();

  -- 2. Check bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE car_id = p_car_id
      AND status IN ('pending', 'confirmed')
      AND daterange(start_date, end_date, '[]') && v_req_range
  ) THEN
    RETURN FALSE;
  END IF;

  -- 3. Check blocked dates
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates
    WHERE car_id = p_car_id
      AND daterange(start_date, end_date, '[]') && v_req_range
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

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

-- 11. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-photos', 'car-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('licenses', 'licenses', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies
CREATE POLICY "Public read for car photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-photos');

CREATE POLICY "Authenticated owners can upload car photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can upload driver license with booking"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'licenses');

CREATE POLICY "Owners can view licenses for their car bookings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'licenses' AND (
      auth.role() = 'service_role' OR
      EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.cars c ON b.car_id = c.id
        JOIN public.owners o ON c.owner_id = o.id
        WHERE o.user_id = auth.uid()
          AND b.license_photo_path = storage.objects.name
      )
    )
  );
