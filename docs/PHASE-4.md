# Phase 4 — Technician System

## Goal
Technician can register, create profile, list skills, get verified, and view incoming jobs.

---

## Database Changes

### Table: `technician_profiles`
```sql
CREATE TABLE technician_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  years_experience INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_docs TEXT[], -- array of doc URLs
  is_available BOOLEAN DEFAULT true,
  max_distance_km DECIMAL(5,1) DEFAULT 20.0,
  completed_jobs INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `technician_skills`
```sql
CREATE TABLE technician_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price_override DECIMAL(10,2), -- technician can set own price
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(technician_id, service_id)
);
```

### RLS Policies
- `technician_profiles`: Technician manages own profile. Public can read verified profiles.
- `technician_skills`: Technician manages own skills. Public can read active skills.

---

## Features

### 4.1 Technician Registration
- After signup with role='technician', redirect to profile setup
- Step form: Basic info → Skills → Verification docs
- Profile must be complete before viewing jobs

### 4.2 Technician Profile
- Bio, years of experience
- Availability toggle
- Max service distance
- Skills list with optional price override per service
- Average rating display

### 4.3 Verification Flow
- Upload verification documents (ID, license, certs → R2)
- Status: unverified → pending → verified/rejected
- Only verified technicians can receive jobs (configurable per admin)

### 4.4 Incoming Jobs (Technician View)
- List of bookings assigned to technician (or available in their area)
- Filter by status, distance, category
- Job card shows: customer name, service, location, distance, time

### 4.5 Job Detail

---

## UI Components

- `TechnicianSetupWizard` — multi-step registration form
- `SkillSelector` — pick services + set custom prices
- `VerificationBadge` — badge showing verification status
- `JobCard` — incoming job summary card
- `AvailabilityToggle` — toggle online/offline

---

## Pages

| Route | Purpose |
|-------|---------|
| `/technician/setup` | Initial profile setup |
| `/technician/profile` | Edit profile |
| `/technician/jobs` | Incoming jobs list |
| `/technician/jobs/[id]` | Job detail |

---

## Checklist

- [ ] Technician registration form saves profile
- [ ] Skills linked to technician
- [ ] Verification status changes correctly
- [ ] Docs upload to R2
- [ ] Jobs list shows relevant bookings
- [ ] Availability toggle works

## Done Definition
- [ ] Technician completes setup → `technician_profiles` row exists
- [ ] Skills appear in `technician_skills` table
- [ ] Verification documents in R2
- [ ] `/technician/jobs` renders bookings (even if empty state)
