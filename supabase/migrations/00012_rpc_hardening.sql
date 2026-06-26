-- Harden SECURITY DEFINER RPC functions: restrict to service_role only
-- Prevents anon/authenticated from calling matching/rating functions directly via PostgREST

REVOKE EXECUTE ON FUNCTION public.match_technicians_for_booking(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_next_available_tech(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_technician_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_chat_conversation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_technicians_for_booking(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_next_available_tech(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_technician_rating() TO service_role;

-- Trigger functions remain callable only via triggers, not RPC
-- handle_new_user and create_chat_conversation are trigger-only

-- Fix handle_updated_at search_path (Supabase advisor lint 0011)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
