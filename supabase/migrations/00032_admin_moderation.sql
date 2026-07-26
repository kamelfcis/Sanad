-- 00032: Admin moderation — blocking users and unblocking cascade deletes.
--
-- Part 1: blocking state on profiles. The auth-level ban (via
--         auth.admin.updateUserById) is what actually stops a login; these
--         columns are the audit trail and what the admin UI renders.
-- Part 2: two foreign keys onto profiles(id) were declared with no delete
--         rule, so Postgres defaults them to NO ACTION and any attempt to
--         delete a technician fails. Both become ON DELETE SET NULL —
--         deliberately NOT cascade, because removing a technician must never
--         silently destroy a customer's booking or payment history.
--
-- Idempotent: safe to re-run.

-- ─── 1. Blocking columns ────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.is_blocked IS 'True when an admin has blocked this account; the auth user is banned in parallel';
COMMENT ON COLUMN public.profiles.blocked_at IS 'When the account was last blocked';
COMMENT ON COLUMN public.profiles.blocked_reason IS 'Optional admin-supplied reason shown in the audit log';
COMMENT ON COLUMN public.profiles.blocked_by IS 'Admin who performed the block; nulled if that admin is later removed';

-- Blocked accounts are a small minority, so a partial index keeps the admin
-- "show blocked only" filter cheap without paying for the common case.
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked
  ON public.profiles (is_blocked)
  WHERE is_blocked;

-- ─── 2. Foreign keys that block deleting a profile ──────────────────────────
--
-- Live constraint names confirmed against the project database:
--   bookings.technician_id  -> bookings_technician_id_fkey   (NO ACTION)
--   payments.verified_by    -> payments_verified_by_fkey     (NO ACTION)
--
-- The loop matches on (table, column) rather than the constraint name, so this
-- still does the right thing if a constraint was ever recreated under a
-- different name. Constraints that already say ON DELETE SET NULL are left
-- untouched, which is what makes re-running a no-op.

DO $$
DECLARE
  target   record;
  con      record;
  new_name text;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('bookings', 'technician_id'),
      ('payments', 'verified_by')
    ) AS v(table_name, column_name)
  LOOP
    new_name := format('%s_%s_fkey', target.table_name, target.column_name);

    -- Drop any single-column FK on this column that is not already SET NULL.
    FOR con IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class     t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = target.table_name
        AND a.attname = target.column_name
        AND array_length(c.conkey, 1) = 1
        AND c.confdeltype <> 'n'          -- 'n' = ON DELETE SET NULL
    LOOP
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        target.table_name, con.conname
      );
      RAISE NOTICE 'dropped % on %.%', con.conname, target.table_name, target.column_name;
    END LOOP;

    -- Recreate it with the delete rule, unless a correct one already exists.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class     t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = target.table_name
        AND a.attname = target.column_name
        AND array_length(c.conkey, 1) = 1
        AND c.confdeltype = 'n'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) '
        'REFERENCES public.profiles(id) ON DELETE SET NULL',
        target.table_name, new_name, target.column_name
      );
      RAISE NOTICE 'recreated % as ON DELETE SET NULL', new_name;
    END IF;
  END LOOP;
END $$;

-- ─── 3. Safety net ──────────────────────────────────────────────────────────
-- Any remaining FK onto profiles(id) with NO ACTION / RESTRICT will make a
-- profile delete fail at runtime with a bare 23503. Report them here — as a
-- warning rather than an exception, so an unrelated constraint cannot roll back
-- the columns above. The DELETE route turns a 23503 into a named error anyway.

DO $$
DECLARE
  offender text;
BEGIN
  SELECT string_agg(format('%s.%s (%s)', t.relname, a.attname, c.conname), ', ')
  INTO offender
  FROM pg_constraint c
  JOIN pg_class     t  ON t.oid = c.conrelid
  JOIN pg_namespace n  ON n.oid = t.relnamespace
  JOIN pg_class     rt ON rt.oid = c.confrelid
  JOIN pg_attribute a  ON a.attrelid = t.oid AND a.attnum = c.conkey[1]
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND rt.relname = 'profiles'
    AND c.confdeltype IN ('a', 'r');    -- 'a' = NO ACTION (implicit default), 'r' = RESTRICT

  IF offender IS NOT NULL THEN
    RAISE WARNING 'FKs onto profiles still lack a delete rule: %', offender;
  ELSE
    RAISE NOTICE 'All FKs onto profiles(id) have an explicit delete rule.';
  END IF;
END $$;
