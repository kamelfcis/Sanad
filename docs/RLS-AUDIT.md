# RLS Audit — Sanad Platform

**Audit date:** 2025-06-25  
**Source:** `supabase/migrations/` (00001–00016)

## Tables Inventory

| Table | Exists | RLS Enabled | Notes |
|-------|--------|-------------|-------|
| `profiles` | ✅ | ✅ | Linked to `auth.users`; admin via `is_admin()` |
| `service_categories` | ✅ | ✅ | Public read (active), admin write |
| `services` | ✅ | ✅ | Public read (active), admin write |
| `bookings` | ✅ | ✅ | Customer/technician/admin scoped |
| `booking_images` | ✅ | ✅ | Scoped via booking ownership |
| `technician_profiles` | ✅ | ✅ | Own profile + verified public read |
| `technician_skills` | ✅ | ✅ | Own write, active public read |
| `booking_assignments` | ✅ | ✅ | Technician/customer/admin scoped |
| `chat_conversations` | ✅ | ✅ | Booking participants only |
| `chat_messages` | ✅ | ✅ | Participants insert/read |
| `reviews` | ✅ | ✅ | Customer write, visible public read |
| `audit_logs` | ✅ | ✅ | Admin read/insert only |
| `notifications` | ❌ | — | **Not present in migrations** (future phase) |
| `storage.objects` (`uploads` bucket) | ✅ | ✅ | User-scoped paths; public read |

---

## Per-Table Access Matrix

Legend: **Risk** = escalation / data exposure risk | **Status** = audit outcome

### profiles

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Self | `auth.uid() = id` | Low | Low | — | ✅ |
| SELECT | Admin | `is_admin()` | Low | Low | Uses SECURITY DEFINER (00014) | ✅ Fixed |
| INSERT | Self | `auth.uid() = id` | Low | Low | Trigger also creates on signup | ✅ |
| UPDATE | Self | `auth.uid() = id` | Medium — role change if API allows | Low | API must not expose `role` field to users | ✅ |
| DELETE | — | No policy | N/A | Low | Cascade from auth.users only | ✅ |

**Current policies:** Users can view/insert/update own; Admin can view all (via `is_admin()`).

---

### technician_profiles

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Self | `id = auth.uid()` (ALL includes read) | Low | Low | — | ✅ |
| SELECT | Public | `verification_status = 'verified'` | Low | Low | — | ✅ |
| SELECT | Customer role | Any customer sees all tech profiles | Info disclosure of unverified | Medium | Narrow to verified only | ⚠️ Documented |
| INSERT/UPDATE/DELETE | Self | Own profile ALL | Cannot set verified status without admin | Low | API restricts verification fields | ✅ |
| ALL | Admin | Admin role check | Low | Low | — | ✅ |

---

### technician_skills

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Public | `is_active = true` | Low | Low | Intended for matching | ✅ |
| ALL | Self | `technician_id = auth.uid()` | Low | Low | — | ✅ |
| ALL | Admin | Admin role check | Low | Low | — | ✅ |

---

### bookings

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Customer | `customer_id = auth.uid()` | Low | Low | — | ✅ |
| SELECT | Technician | Assigned, matched assignments, or skill-matched pending | Low | Medium | Pending visibility by skill is intentional for matching | ✅ |
| INSERT | Customer | `customer_id = auth.uid()` | Low | Low | — | ✅ |
| UPDATE | Customer | Own booking | **Can change status/technician_id** | Medium | API restricts transitions; column RLS optional | ⚠️ API-guarded |
| ALL | Admin | Admin role check | Low | Low | — | ✅ |

---

### booking_assignments

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Technician | `technician_id = auth.uid()` | Low | Low | — | ✅ |
| UPDATE | Technician | Own assignments (accept/reject) | Low | Low | — | ✅ |
| SELECT | Customer | Assignments on own bookings | Low | Low | — | ✅ |
| INSERT/DELETE | — | No direct user policy | Only via SECURITY DEFINER RPC (service_role) | Low | 00012 revokes anon/authenticated EXECUTE | ✅ |
| ALL | Admin | Admin role check | Low | Low | — | ✅ |

---

### chat_conversations

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Participant / Admin | Booking customer or technician | Low | Low | — | ✅ |
| UPDATE | Participant | Own last_read_at | Low | Low | — | ✅ |
| INSERT | — | Trigger-only on booking accepted | Low | Low | — | ✅ |
| DELETE | — | No policy | Cascade from booking | Low | — | ✅ |

---

### chat_messages

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Participant / Admin | Via conversation → booking | Low | Low | — | ✅ |
| INSERT | Participant | `sender_id = auth.uid()` + participant check | Low | Low | — | ✅ |
| UPDATE/DELETE | — | No policy | Low | Low | Immutable chat log | ✅ |

---

### reviews

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Public | `is_hidden = false` OR owner OR admin (00016) | Low | Low | — | ✅ Fixed |
| INSERT | Customer | Own + completed booking | Low | Low | — | ✅ |
| UPDATE/DELETE | Customer | Own reviews | Low | Low | — | ✅ |
| UPDATE | Admin | Via API service role / admin routes | Low | Low | Moderation via API | ✅ |

---

### services / service_categories

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Public | `is_active = true` | Low | Low | — | ✅ |
| ALL | Admin | Admin role check | Low | Low | — | ✅ |

---

### audit_logs

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Admin | Admin role check | Low | Low | — | ✅ |
| INSERT | Admin | Admin or `admin_id = auth.uid()` | Low | Low | — | ✅ |
| UPDATE/DELETE | — | No policy | Immutable audit trail | Low | — | ✅ |

---

### storage.objects (`uploads` bucket)

| Op | Who | Policy | Escalation risk | Risk | Recommendation | Status |
|----|-----|--------|-----------------|------|----------------|--------|
| SELECT | Public | `bucket_id = 'uploads'` | URLs are public by design | Low | Signed upload + auth API | ✅ |
| INSERT | Authenticated | Path `{userId}/...` must match `auth.uid()` | Low | Low | — | ✅ |
| UPDATE/DELETE | Authenticated | Own folder only | Low | Low | — | ✅ |

**Bucket limits (00013, 00015):** 10 MB max; MIME `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

---

### notifications

**Status:** Table does not exist. No RLS required until Phase 10+ push notification feature.

---

## Supabase Advisor Remediation

| Issue | Migration | Status |
|-------|-----------|--------|
| Profiles admin RLS recursion | 00014 `is_admin()` | ✅ Fixed |
| SECURITY DEFINER RPC callable by anon | 00012 revoke + service_role grant | ✅ Fixed |
| Hidden reviews visible via client | 00016 reviews SELECT policy | ✅ Fixed |
| Upload MIME too permissive (HEIC) | 00015 bucket allowlist | ✅ Fixed |
| `handle_updated_at` search_path | 00012 | ✅ Fixed |

---

## Final Status Summary

| Table | RLS | Risk Level | Final Status |
|-------|-----|------------|--------------|
| profiles | ✅ | Low | ✅ Secure |
| service_categories | ✅ | Low | ✅ Secure |
| services | ✅ | Low | ✅ Secure |
| bookings | ✅ | Medium | ⚠️ API-guarded status updates |
| booking_images | ✅ | Low | ✅ Secure |
| technician_profiles | ✅ | Medium | ⚠️ Customer over-read documented |
| technician_skills | ✅ | Low | ✅ Secure |
| booking_assignments | ✅ | Low | ✅ Secure |
| chat_conversations | ✅ | Low | ✅ Secure |
| chat_messages | ✅ | Low | ✅ Secure |
| reviews | ✅ | Low | ✅ Secure (00016) |
| audit_logs | ✅ | Low | ✅ Secure |
| storage uploads | ✅ | Low | ✅ Secure |
| notifications | N/A | — | Not implemented |

**Overall RLS posture:** Production-ready with documented medium-risk items (booking customer UPDATE scope, technician profile customer read) mitigated at API layer.
