-- Seed default platform admin (dev/staging bootstrap).
-- Credentials documented in docs/ADMIN-SETUP.md — change password after first login in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_email TEXT := 'admin@sanad.app';
  admin_password TEXT := 'SanadAdmin2025!';
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt(admin_password, extensions.gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sanad Admin","role":"admin"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

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
      gen_random_uuid(),
      admin_user_id,
      jsonb_build_object('sub', admin_user_id::text, 'email', admin_email),
      'email',
      admin_email,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Ensure profile exists with admin role (trigger may have already created it)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_user_id, admin_email, 'Sanad Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();
END $$;
