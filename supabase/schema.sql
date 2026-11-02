-- ====================================================================
-- VULPI — COMPLETE SUPABASE DATABASE SCHEMA & INITIAL DATA
-- Cagayan de Oro City Car Rental Marketplace
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project -> Click "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
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
  CONSTRAINT valid_block_date_range CHECK (end_date >= start_date)
);

-- Exclusion constraint to prevent overlapping blocks
DO $$ BEGIN
  ALTER TABLE public.blocked_dates
  ADD CONSTRAINT no_overlapping_blocks EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
  CONSTRAINT valid_booking_dates CHECK (end_date >= start_date)
);

-- Exclusion constraint to prevent overlapping active bookings
DO $$ BEGIN
  ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'confirmed'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. INTEGRITY TRIGGERS
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
    RAISE EXCEPTION 'Cannot block dates because there is an active booking in this range.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_blocked_booking ON public.blocked_dates;
CREATE TRIGGER trg_check_blocked_booking
BEFORE INSERT OR UPDATE OF start_date, end_date ON public.blocked_dates
FOR EACH ROW EXECUTE FUNCTION public.check_blocked_dates_against_bookings();

-- Automatic updated_at triggers
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

-- 8. AVAILABILITY & HOLD EXPIRY FUNCTIONS
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
  -- Expire stale pending holds first
  PERFORM public.expire_stale_holds();

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE car_id = p_car_id
      AND status IN ('pending', 'confirmed')
      AND daterange(start_date, end_date, '[]') && v_req_range
  ) THEN
    RETURN FALSE;
  END IF;

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

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Owners policies
DROP POLICY IF EXISTS "Public read active car owners" ON public.owners;
CREATE POLICY "Public read active car owners" ON public.owners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage own profile" ON public.owners;
CREATE POLICY "Owners can manage own profile" ON public.owners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cars policies
DROP POLICY IF EXISTS "Public can view active cars" ON public.cars;
CREATE POLICY "Public can view active cars" ON public.cars FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage own cars" ON public.cars;
CREATE POLICY "Owners can manage own cars" ON public.cars FOR ALL
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()))
  WITH CHECK (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Blocked dates policies
DROP POLICY IF EXISTS "Public can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Owners can manage blocked dates" ON public.blocked_dates FOR ALL
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
DROP POLICY IF EXISTS "Renters can create booking requests" ON public.bookings;
CREATE POLICY "Renters can create booking requests" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read booking by id" ON public.bookings;
CREATE POLICY "Public read booking by id" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can update bookings for their cars" ON public.bookings;
CREATE POLICY "Owners can update bookings for their cars" ON public.bookings FOR UPDATE
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

-- 10. STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-photos', 'car-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read for car photos" ON storage.objects;
CREATE POLICY "Public read for car photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'car-photos');

DROP POLICY IF EXISTS "Authenticated owners can upload car photos" ON storage.objects;
CREATE POLICY "Authenticated owners can upload car photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-photos');

-- 11. INITIAL ADMIN ACCOUNT & REAL CAGAYAN DE ORO FLEET DATA
DO $$
DECLARE
  v_admin_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_admin_owner_id UUID := 'b0000000-0000-0000-0000-000000000001';

  v_car1_vios UUID := 'c1111111-0000-0000-0000-000000000001';
  v_car2_mirage UUID := 'c2222222-0000-0000-0000-000000000002';
  v_car3_fortuner UUID := 'c3333333-0000-0000-0000-000000000003';
  v_car4_innova UUID := 'c4444444-0000-0000-0000-000000000004';
  v_car5_hiace UUID := 'c5555555-0000-0000-0000-000000000005';
  v_car6_ranger UUID := 'c6666666-0000-0000-0000-000000000006';

  v_starter_terms TEXT := 
'1. RENTAL PERIOD & RETURN:
Rental day is 24 hours from vehicle handover. Grace period is 1 hour. Late returns beyond 1 hour are charged at ₱200/hour up to 4 hours; beyond 4 hours, a full day rate applies.

2. REQUIRED DOCUMENTS:
Valid Philippine Driver''s License (or International Driving Permit for foreign nationals) and 1 government-issued secondary ID must be presented upon vehicle handover.

3. SECURITY DEPOSIT:
A refundable security deposit is required upon vehicle pickup and will be returned within 24 hours after inspection upon vehicle return.

4. FUEL POLICY:
Same-to-same fuel policy. The vehicle must be returned with the same fuel level as recorded at handover. Shortfall is charged at current local pump rates + ₱150 service fee.

5. OUT-OF-CITY TRAVEL:
Trips outside Cagayan de Oro City limits (e.g., Bukidnon, Iligan, Initao, Dahilayan, Balingasag) must be declared prior to departure and charged under the out-of-city rate.

6. PROHIBITED USES:
Sub-renting, street racing, towing other vehicles, transportation of illicit goods, or driving under the influence of alcohol/drugs is strictly prohibited.

7. TRAFFIC VIOLATIONS & TOLLS:
The renter is fully liable for any traffic citations, speeding tickets, and RFID/toll fees incurred during the rental window.

8. ACCIDENTS & DAMAGE:
In the event of an accident, notify the owner immediately and obtain a police report. Renter is liable for the participation fee or actual repair cost according to assessment.

9. CLEANING FEE:
Excessive interior dirt, mud, sand, foul odor, or stains requiring deep detailing will incur a cleaning fee of ₱500–₱1,500.

10. CANCELLATION:
Please notify the owner at least 24 hours prior to pickup if you need to reschedule or cancel your reservation.';

BEGIN

  -- A. Insert or update Admin Auth User (Password: VulpiAdmin2026!)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vulpi.ph') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@vulpi.ph',
      crypt('VulpiAdmin2026!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Vulpi Fleet Admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );
  ELSE
    SELECT id INTO v_admin_user_id FROM auth.users WHERE email = 'admin@vulpi.ph';
    UPDATE auth.users
    SET encrypted_password = crypt('VulpiAdmin2026!', gen_salt('bf')),
        email_confirmed_at = NOW()
    WHERE id = v_admin_user_id;
  END IF;

  -- Ensure identity exists in auth.identities (Required by Supabase Auth)
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_user_id) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_admin_user_id,
      v_admin_user_id,
      jsonb_build_object('sub', v_admin_user_id::text, 'email', 'admin@vulpi.ph'),
      'email',
      v_admin_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- B. Dummy Partner Host Record (Kagay-an Wheels & CDO Fleet)
  -- The platform admin (admin@vulpi.ph) operates the marketplace, while partner hosts own the fleet.
  INSERT INTO public.owners (
    id,
    user_id,
    name_or_business,
    phone,
    email,
    messenger_link,
    pickup_location,
    terms_text,
    is_verified
  ) VALUES (
    v_admin_owner_id,
    NULL,
    'Kagay-an Wheels & CDO Fleet',
    '+63 917 888 1234',
    'partner@kagayanwheels.ph',
    'https://m.me/kagayanwheels',
    'SM City Uptown / Pueblo de Oro, Cagayan de Oro City',
    v_starter_terms,
    true
  ) ON CONFLICT (id) DO UPDATE SET
    name_or_business = EXCLUDED.name_or_business,
    phone = EXCLUDED.phone,
    pickup_location = EXCLUDED.pickup_location,
    terms_text = EXCLUDED.terms_text,
    is_verified = true
  RETURNING id INTO v_admin_owner_id;

  -- C. Insert Real Cars (Popular CDO Rental Vehicles)
  -- 1. Toyota Vios 1.3 XLE (Sedan)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car1_vios, v_admin_owner_id, 'Toyota', 'Vios 1.3 XLE', 2023, 'KAA 1234', 'sedan', 'automatic', 5, 'gasoline',
    ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80'],
    1600.00, 2000.00, false, null, 2000.00, 'Fuel-efficient sedan, perfect for city driving, airport pickups, and business trips.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

  -- 2. Mitsubishi Mirage GLX (Hatchback)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car2_mirage, v_admin_owner_id, 'Mitsubishi', 'Mirage GLX', 2022, 'KAB 5678', 'hatchback', 'automatic', 5, 'gasoline',
    ARRAY['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80'],
    1300.00, 1700.00, false, null, 2000.00, 'Compact and easy to park around Divisoria and downtown Cagayan de Oro.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

  -- 3. Toyota Fortuner 2.8 4x2 (SUV)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car3_fortuner, v_admin_owner_id, 'Toyota', 'Fortuner 2.8 4x2', 2024, 'KAC 9012', 'suv', 'automatic', 7, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80'],
    3500.00, 4200.00, true, 800.00, 3000.00, 'Premium 7-seater SUV with high ground clearance. Ideal for Dahilayan and Bukidnon mountain trips.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

  -- 4. Toyota Innova 2.8 E (MPV)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car4_innova, v_admin_owner_id, 'Toyota', 'Innova 2.8 E', 2023, 'KAD 3456', 'mpv', 'automatic', 8, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'],
    2500.00, 3000.00, true, 700.00, 2500.00, 'Comfortable 8-seater family car with large luggage capacity and strong diesel engine.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

  -- 5. Toyota HiAce Commuter (Van)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car5_hiace, v_admin_owner_id, 'Toyota', 'HiAce Commuter', 2022, 'KAE 7890', 'van', 'manual', 15, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80'],
    3200.00, 3800.00, true, 800.00, 3000.00, '15-passenger van for group tours, wedding guests, or corporate delegations in Northern Mindanao.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

  -- 6. Ford Ranger 2.0 Bi-Turbo (Pickup)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car6_ranger, v_admin_owner_id, 'Ford', 'Ranger 2.0 Bi-Turbo', 2023, 'KAF 1122', 'pickup', 'automatic', 5, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80'],
    3200.00, 3900.00, true, 800.00, 3000.00, 'Powerful double-cab pickup truck with spacious cargo bed. Perfect for heavy luggage or project trips.', true
  ) ON CONFLICT (id) DO UPDATE SET
    daily_rate_in_city = EXCLUDED.daily_rate_in_city,
    daily_rate_out_of_city = EXCLUDED.daily_rate_out_of_city;

END $$;
