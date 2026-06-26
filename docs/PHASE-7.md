# Phase 7 — Reviews & Ratings

## Goal
Customers can rate and review completed bookings. Technician average rating calculated dynamically. Rating distribution visible on technician profile.

---

## Database Changes

### Migration: `00009_reviews.sql`

#### Table: `reviews`
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Indexes
- `idx_reviews_technician` ON reviews(technician_id)
- `idx_reviews_booking` ON reviews(booking_id)

#### Trigger: `on_review_change`
After INSERT/UPDATE/DELETE on `reviews`:
```sql
UPDATE technician_profiles
SET average_rating = ROUND(AVG(rating)::numeric, 1),
    total_ratings = COUNT(*)
WHERE id = <affected technician_id>;
```

#### RLS Policies
| Policy | Operation | Scope |
|--------|-----------|-------|
| Customers insert own reviews | INSERT | customer_id = auth.uid() AND booking is completed |
| Customers manage own reviews | UPDATE/DELETE | customer_id = auth.uid() |
| Anyone read reviews | SELECT | public — true |

---

## Features

### 7.1 Review Submission
- Triggered when booking status = `completed`
- Amber prompt card on booking detail page: "How was your experience?"
- Click opens `/customer/bookings/[id]/review` page
- 5-star interactive rating with hover labels (Poor → Excellent)
- Optional text comment (max 1000 characters)
- UNIQUE(booking_id) constraint prevents duplicate reviews
- 409 Conflict returned if duplicate attempted

### 7.2 Rating Display
- **Average rating**: Displayed on technician profile sidebar + RatingSummary
- **Distribution bar chart**: 5-star → 1-star breakdown with proportional bars (green/yellow/red)
- **Review cards**: Avatar, customer name, date, stars, comment
- **Booking detail**: Shows submitted star rating + comment after review

### 7.3 Automatic Recalculation
- DB trigger `recalculate_technician_rating()` runs on INSERT/UPDATE/DELETE
- Updates `technician_profiles.average_rating` (DECIMAL 2,1)
- Updates `technician_profiles.total_ratings` (INTEGER)
- SECURITY DEFINER function, bypasses RLS

### 7.4 API Validation
- Only the booking's customer can review
- Only `completed` bookings can be reviewed
- Rating must be INTEGER 1–5
- Technician must be assigned to the booking
- Duplicate reviews return HTTP 409

---

## API Routes

| Route | Method | Request | Response | Purpose |
|-------|--------|---------|----------|---------|
| `/api/reviews` | GET | `?technician_id=UUID` or `?booking_id=UUID` | Review[] or Review\|null | Fetch reviews |
| `/api/reviews` | POST | `{ booking_id, rating, comment? }` | Review (201) | Create review |
| `/api/reviews/booking/[id]` | GET | — | Review \| null | Check existing review |

---

## React Query Hooks (`src/hooks/use-reviews.ts`)

| Hook | Query Key | Purpose |
|------|-----------|---------|
| `useTechnicianReviews(technicianId)` | `['technician-reviews', id]` | All reviews for a technician |
| `useBookingReview(bookingId)` | `['booking-review', id]` | Single review for a booking |
| `useCreateReview()` | mutation | Creates review, invalidates `booking-review`, `technician-reviews`, `technician-profile` |

---

## UI Components

### `StarRating` (`src/components/shared/star-rating.tsx`)
- **Props**: `rating`, `onChange?`, `maxStars?` (default 5), `size?` (sm/md/lg), `disabled?`
- Interactive mode: clickable stars with hover scale effect
- Display mode: filled/half-filled/empty star styling
- Sizes: sm (12px), md (20px), lg (28px)

### `ReviewForm` (`src/components/shared/review-form.tsx`)
- 5-star clickable rating with hover labels
- Textarea comment with character counter (1000 max)
- Submit button disabled until rating selected
- Loading spinner during submission

### `ReviewCard` (`src/components/shared/review-card.tsx`)
- Customer avatar + name + date
- Star rating display + comment text

### `RatingSummary` (`src/components/shared/rating-summary.tsx`)
- Large average rating number + star display + review count
- Distribution bars per star level (5→1)
- Color-coded: 5-4★ green, 3★ yellow, 2-1★ red

### `ReviewPrompt` (`src/components/shared/review-prompt.tsx`)
- Amber notification card with star icon
- "Review" CTA button linking to review page

---

## Pages

| Route | Purpose | Features |
|-------|---------|----------|
| `/customer/bookings/[id]/review` | Leave a review | Validates completed status, renders ReviewForm, redirects on success |

### Modified Pages

| Page | Changes |
|------|---------|
| `/customer/bookings/[id]` | Shows amber ReviewPrompt when `completed` + no review; shows star rating if already reviewed |
| `/technician/profile` | Full reviews section with RatingSummary sidebar + ReviewCard list |

---

## Build Output (32 routes)

New routes added:
- `○ /customer/bookings/[id]/review` — Review page
- `ƒ /api/reviews` — GET/POST reviews
- `ƒ /api/reviews/booking/[id]` — GET single review by booking

---

## Checklist

- [x] Reviews table with UNIQUE booking constraint
- [x] Rating 1–5 enforced at DB + API level
- [x] Only completed bookings can be reviewed
- [x] Duplicate reviews return 409
- [x] Trigger recalculates average_rating + total_ratings automatically
- [x] RLS: customers insert/update/delete their own; anyone read
- [x] Indexes on technician_id and booking_id
- [x] StarRating interactive + display components
- [x] Review form with rating + comment
- [x] Rating summary with distribution chart
- [x] Technician profile shows all reviews
- [x] Amber prompt on completed booking detail
- [x] Zero TypeScript errors
- [x] Zero ESLint errors

## Done Definition
- [x] Completed booking can be reviewed → POST /api/reviews creates row
- [x] Average rating updates automatically on INSERT/UPDATE/DELETE
- [x] Duplicate review attempt → HTTP 409
- [x] RLS enforced — auth.uid() checks on all operations
- [x] Build passes with zero TS errors and zero ESLint errors
