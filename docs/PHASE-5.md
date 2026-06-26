# Phase 5 — Matching & Assignment Engine

## Goal
Customer's booking gets assigned to a technician. Manual assignment (admin) + basic auto-matching by category/location.

---

## Database Changes

### Table: `booking_assignments`
```sql
CREATE TABLE booking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, technician_id)
);
```

### Alter `bookings` table
```sql
-- Ensure technician_id + status transition triggers
-- Add function to auto-match
```

---

## Features

### 5.1 Auto-Matching Algorithm
When a booking is created with status `pending`:
1. Find verified technicians with matching skills (same service category)
2. Filter by availability (is_available = true)
3. Filter by location (within max_distance_km)
4. Sort by: rating (desc) → completed_jobs (desc)
5. Create `booking_assignments` for top 3 matches
6. Update booking status to `matched`

### 5.2 Accept / Reject Flow
- Technician sees assignment in their jobs list
- Accept: `booking_assignment.status = 'accepted'`, `booking.status = 'accepted'`
- Reject: `booking_assignment.status = 'rejected'`, next match assigned
- Timeout (15 min): auto-reject

### 5.3 Manual Assignment (Admin)
- Admin can assign any technician to any booking
- Override auto-match
- Force-assign specific technician

### 5.4 Status Updates
- Technician marks `in_progress` when they arrive
- Technician marks `completed` when done
- Customer can mark `completed` or `disputed`

### 5.5 Notifications
- In-app notification when matched
- In-app notification when status changes

---

## UI Components

- `AssignmentStatus` — shows current assignment state
- `JobActionBar` — Accept / Reject buttons with timer
- `AssignTechnicianSheet` — admin panel for manual assignment
- `TechnicianMatchCard` — shows matched tech info

---

## Pages

No new pages. Adds components to existing:
- `/technician/jobs/[id]` — accept/reject actions
- `/admin/bookings/[id]` — manual assignment UI

---

## Checklist

- [ ] Auto-matching runs on booking creation
- [ ] Top 3 techs get assignment records
- [ ] Technician can accept → status updates
- [ ] Technician can reject → next tech assigned
- [ ] 15-min timeout auto-rejects
- [ ] Admin can manually assign
- [ ] Status transitions are enforced

## Done Definition
- [ ] Booking created → `booking_assignments` rows created
- [ ] Technician accepts → `booking.status = 'accepted'`
- [ ] All reject → `booking.status = 'pending'` (no available techs)
