# Phase 6 — Real-time Chat System

## Goal
Booking-based real-time chat between customer and technician using Supabase Realtime. File sharing support.

---

## Database Changes

### Table: `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### Table: `chat_conversations`
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: create conversation on booking acceptance
```

### RLS Policies
- `chat_messages`: Participants in the booking can SELECT/INSERT
- `chat_conversations`: Participants can SELECT

---

## Features

### 6.1 Chat Room
- One chat room per booking (created when booking is accepted)
- Load message history (last 50, scroll to load more)
- Real-time subscription for new messages

### 6.2 Sending Messages
- Text messages
- File sharing (images, docs → R2)
- Message status: sent, delivered

### 6.3 Real-time Subscription
- Subscribe to `chat_messages` channel filtered by `booking_id`
- Optimistic UI updates
- Scroll to bottom on new message

### 6.4 Unread Indicator
- Track last read message per user
- Show unread badge in jobs list

### 6.5 Chat List
- Show all active conversations for user
- Last message preview
- Time since last message

---

## UI Components

- `ChatRoom` — full chat interface
- `ChatMessage` — single message bubble (sent vs received)
- `ChatInput` — text input + file attach button
- `ChatList` — list of conversations
- `FileAttachment` — file preview (image/document)
- `UnreadBadge` — notification dot

---

## Pages

| Route | Purpose |
|-------|---------|
| `/customer/bookings/[id]/chat` | Customer chat for booking |
| `/technician/jobs/[id]/chat` | Technician chat for booking |
| `/customer/chat` | All conversations |
| `/technician/chat` | All conversations |

---

## Checklist

- [ ] Messages save to DB
- [ ] Real-time subscription delivers new messages
- [ ] Files upload via chat
- [ ] Chat room per booking
- [ ] Message history loads on open
- [ ] Unread count works
- [ ] RLS restricts access to participants

## Done Definition
- [ ] Customer sends message → technician sees it in <1s
- [ ] Technician sends message → customer sees it in <1s
- [ ] File attachment appears in chat
- [ ] Conversations list shows last message preview
