-- Destructive cleanup: remove all users and transactional data except admin@sanad.app
-- Preserves: hero_slides, service_categories, services, payment_settings
-- Run against linked project only after verifying admin email.

BEGIN;

CREATE TEMP TABLE cleanup_report (
  step TEXT PRIMARY KEY,
  deleted_count BIGINT NOT NULL DEFAULT 0,
  detail TEXT
);

DO $$
DECLARE
  v_admin_id UUID;
  v_admin_email CONSTANT TEXT := 'admin@sanad.app';
  n BIGINT;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'ABORT: Admin user % not found — no changes applied', v_admin_email;
  END IF;

  INSERT INTO cleanup_report (step, deleted_count, detail)
  VALUES ('admin_preserved', 1, v_admin_id::text || ' (' || v_admin_email || ')');

  -- Transactional / booking tree (child tables first)
  DELETE FROM chat_messages;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('chat_messages', n, NULL);

  DELETE FROM chat_conversations;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('chat_conversations', n, NULL);

  DELETE FROM reviews;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('reviews', n, NULL);

  DELETE FROM payments;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('payments', n, NULL);

  DELETE FROM booking_assignments;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('booking_assignments', n, NULL);

  DELETE FROM booking_images;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('booking_images', n, NULL);

  DELETE FROM bookings;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('bookings', n, NULL);

  DELETE FROM notifications WHERE user_id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('notifications', n, NULL);

  DELETE FROM audit_logs;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('audit_logs', n, NULL);

  DELETE FROM technician_skills
  WHERE technician_id IN (SELECT id FROM technician_profiles WHERE id != v_admin_id);
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('technician_skills', n, NULL);

  DELETE FROM technician_profiles WHERE id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('technician_profiles', n, NULL);

  -- storage.objects: direct DELETE blocked by storage.protect_delete(); purge via Storage API if needed
  INSERT INTO cleanup_report VALUES (
    'storage.objects (uploads)',
    0,
    'skipped — use Storage API to remove orphaned files under deleted user folders'
  );

  -- Auth session data for non-admin users
  DELETE FROM auth.sessions WHERE user_id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('auth.sessions', n, NULL);

  DELETE FROM auth.refresh_tokens WHERE user_id::uuid != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('auth.refresh_tokens', n, NULL);

  BEGIN
    DELETE FROM auth.mfa_factors WHERE user_id != v_admin_id;
    GET DIAGNOSTICS n = ROW_COUNT;
    INSERT INTO cleanup_report VALUES ('auth.mfa_factors', n, NULL);
  EXCEPTION WHEN undefined_table THEN
    INSERT INTO cleanup_report VALUES ('auth.mfa_factors', 0, 'table not present');
  END;

  BEGIN
    DELETE FROM auth.one_time_tokens WHERE user_id != v_admin_id;
    GET DIAGNOSTICS n = ROW_COUNT;
    INSERT INTO cleanup_report VALUES ('auth.one_time_tokens', n, NULL);
  EXCEPTION WHEN undefined_table THEN
    INSERT INTO cleanup_report VALUES ('auth.one_time_tokens', 0, 'table not present');
  END;

  DELETE FROM auth.identities WHERE user_id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('auth.identities', n, NULL);

  DELETE FROM public.profiles WHERE id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('profiles', n, NULL);

  DELETE FROM auth.users WHERE id != v_admin_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO cleanup_report VALUES ('auth.users', n, NULL);
END $$;

COMMIT;

-- Report + verification (read-only)
SELECT 'DELETION_REPORT' AS section, step, deleted_count, detail
FROM cleanup_report
ORDER BY step;

SELECT 'VERIFICATION' AS section,
  (SELECT COUNT(*) FROM auth.users) AS auth_users_remaining,
  (SELECT COUNT(*) FROM public.profiles) AS profiles_remaining,
  (SELECT email FROM auth.users LIMIT 1) AS remaining_user_email,
  (SELECT role FROM public.profiles LIMIT 1) AS remaining_profile_role,
  (SELECT COUNT(*) FROM bookings) AS bookings_remaining,
  (SELECT COUNT(*) FROM chat_conversations) AS chat_conversations_remaining,
  (SELECT COUNT(*) FROM notifications) AS notifications_remaining,
  (SELECT COUNT(*) FROM service_categories) AS service_categories_preserved,
  (SELECT COUNT(*) FROM services) AS services_preserved,
  (SELECT COUNT(*) FROM hero_slides) AS hero_slides_preserved,
  (SELECT COUNT(*) FROM payment_settings) AS payment_settings_preserved;
