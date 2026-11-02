-- ====================================================================
-- Vulpi — Seed Data
-- 2 Owners, 6 Cars (Different car types), Blocked dates & Sample bookings
-- ====================================================================

-- Starter Terms Template
DO $$
DECLARE
  v_user1_id UUID := '00000000-0000-0000-0000-000000000001';
  v_user2_id UUID := '00000000-0000-0000-0000-000000000002';
  v_owner1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_owner2_id UUID := '22222222-2222-2222-2222-222222222222';
  
  v_car1_vios UUID := 'a1111111-0000-0000-0000-000000000001';
  v_car2_mirage UUID := 'a2222222-0000-0000-0000-000000000002';
  v_car3_fortuner UUID := 'a3333333-0000-0000-0000-000000000003';
  v_car4_innova UUID := 'a4444444-0000-0000-0000-000000000004';
  v_car5_hiace UUID := 'a5555555-0000-0000-0000-000000000005';
  v_car6_ranger UUID := 'a6666666-0000-0000-0000-000000000006';

  v_starter_terms TEXT := 
'1. RENTAL PERIOD & RETURN:
Rental day is 24 hours from pickup. Grace period is 1 hour. Late returns beyond 1 hour are charged at ₱200/hour up to 4 hours; beyond 4 hours, a full day rate applies.

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

  -- 1. Insert dummy auth users if they don't exist
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  VALUES 
    (v_user1_id, 'owner1@vulpi.ph', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Juan Dela Cruz"}', NOW(), NOW(), 'authenticated', 'authenticated'),
    (v_user2_id, 'owner2@vulpi.ph', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Maria Santos"}', NOW(), NOW(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Owners
  INSERT INTO public.owners (id, user_id, name_or_business, phone, email, messenger_link, pickup_location, terms_text, is_verified)
  VALUES
    (
      v_owner1_id,
      v_user1_id,
      'Kagay-an Wheels Auto Rental',
      '+63 917 123 4567',
      'owner1@vulpi.ph',
      'https://m.me/kagayanwheels',
      'SM City Uptown / Pueblo de Oro, Cagayan de Oro City',
      v_starter_terms,
      true
    ),
    (
      v_owner2_id,
      v_user2_id,
      'Oro Express Car Rentals',
      '+63 928 987 6543',
      'owner2@vulpi.ph',
      'https://m.me/oroexpressrentals',
      'Limketkai Center / Downtown, Cagayan de Oro City',
      v_starter_terms,
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    name_or_business = EXCLUDED.name_or_business,
    phone = EXCLUDED.phone,
    pickup_location = EXCLUDED.pickup_location,
    terms_text = EXCLUDED.terms_text;

  -- 3. Insert 6 Diverse Cars
  -- Car 1: Sedan (Vios)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car1_vios, v_owner1_id, 'Toyota', 'Vios 1.3 XLE', 2023, 'KAA 1234', 'sedan', 'automatic', 5, 'gasoline',
    ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80'],
    1600.00, 2000.00, false, null, 2000.00, 'Fuel-efficient, perfect for business meetings, airport runs, or city driving.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- Car 2: Hatchback (Mirage)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car2_mirage, v_owner2_id, 'Mitsubishi', 'Mirage GLX', 2022, 'KBB 5678', 'hatchback', 'automatic', 5, 'gasoline',
    ARRAY['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80'],
    1300.00, 1700.00, false, null, 1500.00, 'Super easy to park in Divisoria & Centrio. High fuel mileage.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- Car 3: SUV (Fortuner)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car3_fortuner, v_owner1_id, 'Toyota', 'Fortuner 2.8 4x2', 2024, 'KCC 9012', 'suv', 'automatic', 7, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80'],
    3500.00, 4200.00, true, 800.00, 5000.00, 'Spacious 7-seater SUV. Ideal for Dahilayan Adventure Park & Bukidnon highlands.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- Car 4: MPV (Innova)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car4_innova, v_owner2_id, 'Toyota', 'Innova 2.8 E', 2023, 'KDD 3456', 'mpv', 'automatic', 8, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'],
    2500.00, 3000.00, true, 700.00, 3000.00, 'The favorite family MPV in Northern Mindanao. Smooth diesel power, ample luggage space.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- Car 5: Van (HiAce Grandia)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car5_hiace, v_owner1_id, 'Toyota', 'HiAce Grandia Tourer', 2022, 'KEE 7890', 'van', 'manual', 12, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1000&q=80'],
    3800.00, 4500.00, true, 800.00, 5000.00, 'Comfortable 12-seater passenger van. Perfect for tour groups, wedding parties, or corporate travel.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- Car 6: Pickup (Ford Ranger)
  INSERT INTO public.cars (
    id, owner_id, make, model, year, plate_number, car_type, transmission, seats, fuel_type,
    photos, daily_rate_in_city, daily_rate_out_of_city, driver_available, driver_fee, security_deposit, notes, is_active
  ) VALUES (
    v_car6_ranger, v_owner2_id, 'Ford', 'Ranger Wildtrak 2.0 Bi-Turbo', 2023, 'KFF 2345', 'pickup', 'automatic', 5, 'diesel',
    ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80'],
    3000.00, 3600.00, false, null, 4000.00, 'Robust pickup with cargo bed, perfect for farm visits or equipment hauling across Region 10.', true
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Sample Blocked Dates (e.g. routine maintenance / scheduled personal trip)
  INSERT INTO public.blocked_dates (car_id, start_date, end_date, reason)
  VALUES
    (v_car1_vios, CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '14 days', 'repairs'),
    (v_car5_hiace, CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '22 days', 'personal')
  ON CONFLICT DO NOTHING;

  -- 5. Sample Bookings (confirmed and pending hold)
  INSERT INTO public.bookings (
    car_id, renter_name, renter_phone, renter_email, start_date, end_date,
    destination_type, destination_details, with_driver, estimated_total, status, hold_expires_at, terms_accepted_at
  ) VALUES
    (
      v_car1_vios, 'Mark Villanueva', '+63 917 555 1234', 'mark.v@example.ph',
      CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '4 days',
      'within_cdo', 'Business trip between Carmen and Macasandig', false, 4800.00, 'confirmed', NOW() + INTERVAL '24 hours', NOW()
    ),
    (
      v_car3_fortuner, 'Carla Ramos', '+63 920 888 7766', 'carla.ramos@example.ph',
      CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days',
      'outside_cdo', 'Family vacation to Dahilayan Adventure Park, Bukidnon', true, 15000.00, 'pending', NOW() + INTERVAL '24 hours', NOW()
    )
  ON CONFLICT DO NOTHING;

END $$;
