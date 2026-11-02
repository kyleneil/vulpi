-- ====================================================================
-- Vulpi — Seed / Activate Platform Admin User
-- Email: vulpi.cdo@gmail.com
-- ====================================================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- 1. Ensure pgcrypto extension is active for password hashing
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- 2. Check if admin user already exists in auth.users
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'vulpi.cdo@gmail.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();

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
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'vulpi.cdo@gmail.com',
      crypt('VulpiAdmin082118%', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Vulpi Platform Admin"}'::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );
  ELSE
    -- If already exists, update password and confirm email
    UPDATE auth.users
    SET encrypted_password = crypt('VulpiAdmin082118%', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW(),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{name}', '"Vulpi Platform Admin"')
    WHERE id = v_admin_id;
  END IF;

  -- 3. Ensure identity exists in auth.identities (Required by Supabase Auth GoTrue)
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_id) THEN
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
      v_admin_id::text,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'vulpi.cdo@gmail.com'),
      'email',
      v_admin_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- 4. Create an associated owner profile so admin can also test fleet management
  IF NOT EXISTS (SELECT 1 FROM public.owners WHERE user_id = v_admin_id) THEN
    INSERT INTO public.owners (
      user_id,
      name_or_business,
      phone,
      email,
      pickup_location,
      is_verified
    ) VALUES (
      v_admin_id,
      'Vulpi Platform Admin',
      '+63 900 000 0000',
      'vulpi.cdo@gmail.com',
      'Cagayan de Oro City',
      true
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Admin user vulpi.cdo@gmail.com successfully seeded/updated!';
END $$;
