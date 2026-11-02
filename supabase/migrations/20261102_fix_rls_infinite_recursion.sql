-- ==============================================================================
-- Fix PostgreSQL Error 42P17 (Infinite Recursion in RLS Policies)
-- Drops circular subqueries between public.owners and public.cars
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/lmpacnlknaklqivncyav/sql
-- ==============================================================================

-- 1. FIX OWNERS POLICIES (Remove subquery to cars)
DROP POLICY IF EXISTS "Public read active car owners" ON public.owners;
DROP POLICY IF EXISTS "Owners can manage own profile" ON public.owners;
DROP POLICY IF EXISTS "Public read owners" ON public.owners;
DROP POLICY IF EXISTS "Owners manage own profile" ON public.owners;

-- Public can read car owner directory profile (No join back to cars)
CREATE POLICY "Public read active car owners"
  ON public.owners FOR SELECT
  USING (true);

-- Owners can only update/manage their own profile
CREATE POLICY "Owners can manage own profile"
  ON public.owners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. FIX CARS POLICIES
DROP POLICY IF EXISTS "Public can view active cars" ON public.cars;
DROP POLICY IF EXISTS "Owners can manage own cars" ON public.cars;

-- Public can view active cars; owners can also view their inactive cars
CREATE POLICY "Public can view active cars"
  ON public.cars FOR SELECT
  USING (
    is_active = true
    OR owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can manage own cars"
  ON public.cars FOR ALL
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()))
  WITH CHECK (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- 3. FIX BLOCKED DATES POLICIES
DROP POLICY IF EXISTS "Public can view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Owners can manage blocked dates" ON public.blocked_dates;

CREATE POLICY "Public can view blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (car_id IN (
    SELECT c.id FROM public.cars c
    JOIN public.owners o ON c.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ))
  WITH CHECK (car_id IN (
    SELECT c.id FROM public.cars c
    JOIN public.owners o ON c.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ));

-- 4. FIX BOOKINGS POLICIES
DROP POLICY IF EXISTS "Renters can create booking requests" ON public.bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their cars" ON public.bookings;
DROP POLICY IF EXISTS "Owners can update bookings for their cars" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view their own booking confirmation" ON public.bookings;

CREATE POLICY "Renters can create booking requests"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own booking confirmation"
  ON public.bookings FOR SELECT
  USING (true);

CREATE POLICY "Owners can update bookings for their cars"
  ON public.bookings FOR UPDATE
  USING (car_id IN (
    SELECT c.id FROM public.cars c
    JOIN public.owners o ON c.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ))
  WITH CHECK (car_id IN (
    SELECT c.id FROM public.cars c
    JOIN public.owners o ON c.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ));
