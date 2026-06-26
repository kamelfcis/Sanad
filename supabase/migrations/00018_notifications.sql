-- 00018: Real-time Notifications System
-- Creates notifications table, indexes, RLS, and Realtime publication

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON notifications(user_id, is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admin full access notifications"
  ON notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
