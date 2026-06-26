# Phase 3 — Customer Booking System

## Goal
Customer can create a service request: pick a service, upload images (R2), set location, and submit. Booking stored in DB with `pending` status.

---

## Database Changes

### Table: `bookings`
```sql
CREATE TYPE booking_status AS ENUM (
  'pending', 'matched', 'accepted', 'in_progress',
  'completed', 'cancelled', 'disputed'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES profiles(id),
  status booking_status NOT NULL DEFAULT 'pending',
  description TEXT,
  location_address TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  preferred_time TIMESTAMPTZ,
  price_quote DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `booking_images`
```sql
CREATE TABLE booking_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'customer' CHECK (image_type IN ('customer', 'technician', 'review')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- `bookings`: Customer owns their bookings (SELECT, INSERT, UPDATE own)
- `booking_images`: Customer owns their images, technician can view assigned

---

## Features

### 3.1 Service Selection Flow
1. Customer selects a service category
2. Customer picks a specific service
3. Customer fills in booking form

### 3.2 Booking Form
- Service description (textarea)
- Preferred time (datetime picker)
- Location (manual address input + optional lat/lng)
- Image upload (Cloudflare R2 via presigned URL)

### 3.3 Image Upload (Cloudflare R2)
- Upload directly from client to R2 via presigned URL
- Backend generates presigned URL
- Store returned URL in `booking_images`
- Show upload progress
- Max 5 images per booking

### 3.4 Booking Confirmation
- After submission, show booking details page
- Booking ID, status, created time
- Edit/cancel option (if still pending)

### 3.5 Booking Status Lifecycle
```
pending → matched → accepted → in_progress → completed
  ↓          ↓          ↓           ↓
cancelled  cancelled  cancelled   disputed
```

---

## UI Components

- `BookingForm` — full booking creation form with react-hook-form + zod
- `ImageUploader` — drag & drop + preview for R2 uploads
- `BookingCard` — summary card for booking list
- `BookingStatus` — status badge with color mapping
- `BookingDetail` — full booking view

---

## Pages

| Route | Purpose |
|-------|---------|
| `/customer/bookings/new` | Create booking |
| `/customer/bookings` | List customer bookings |
| `/customer/bookings/[id]` | Booking detail |

---

## Checklist

- [ ] Booking form validates with zod
- [ ] Booking creates DB record with status 'pending'
- [ ] Images upload to R2 successfully
- [ ] Images linked to booking record
- [ ] Booking detail shows all data
- [ ] Customer can see their bookings list
- [ ] Status lifecycle enforces valid transitions

## Done Definition
- [ ] Customer creates booking → status=`pending` in DB
- [ ] Images appear in R2 bucket
- [ ] Booking detail page loads with all data
- [ ] `booking_images` table has entries linked to booking
