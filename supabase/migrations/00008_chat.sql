-- 00008: Real-time Chat System
-- Creates chat_conversations, chat_messages, trigger, RLS, and Realtime publication

-- 1. chat_conversations (one per accepted booking)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  customer_last_read_at TIMESTAMPTZ DEFAULT now(),
  technician_last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- 2. chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_booking
  ON chat_conversations(booking_id);

-- 4. Trigger: auto-create conversation when booking is accepted
CREATE OR REPLACE FUNCTION create_chat_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO chat_conversations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_accepted ON bookings;
CREATE TRIGGER on_booking_accepted
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_conversation();

-- Also create conversation for existing accepted bookings (if any)
INSERT INTO chat_conversations (booking_id)
SELECT id FROM bookings WHERE status = 'accepted'
ON CONFLICT (booking_id) DO NOTHING;

-- 5. RLS policies
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: participants and admins can read
CREATE POLICY "Participants read conversations"
  ON chat_conversations FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid() OR technician_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update: participants can update their own last_read_at
CREATE POLICY "Participants update last_read_at"
  ON chat_conversations FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid() OR technician_id = auth.uid()
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid() OR technician_id = auth.uid()
    )
  );

-- Messages: participants can read
CREATE POLICY "Participants read messages"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM chat_conversations c
      JOIN bookings b ON b.id = c.booking_id
      WHERE b.customer_id = auth.uid() OR b.technician_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages: participants can insert
CREATE POLICY "Participants insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT c.id FROM chat_conversations c
      JOIN bookings b ON b.id = c.booking_id
      WHERE b.customer_id = auth.uid() OR b.technician_id = auth.uid()
    )
  );

-- 6. Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
