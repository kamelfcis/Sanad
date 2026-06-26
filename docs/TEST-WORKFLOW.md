# Sanad — End-to-End Booking Test Workflow
# سند — دليل اختبار حجز العميل → الصنايعي

**Purpose:** Manual QA playbook for the full customer → technician booking lifecycle.  
**الغرض:** دليل اختبار يدوي لمسار الحجز الكامل من العميل إلى الصنايعي.

**Last updated:** 2025-06-26  
**App URL (local):** `http://localhost:3000`

---

## Pre-flight Checklist | قائمة التحقق قبل الاختبار

### Environment variables | متغيرات البيئة

| Variable | Required | Why |
|----------|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Client + server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Auto-match RPC (`match_technicians_for_booking`), technician browse (`GET /api/technicians/browse`), direct assignment on booking POST |
| `NEXT_PUBLIC_APP_URL` | ✅ | OAuth redirects (`http://localhost:3000` locally) |

Copy from `.env.local.example` or existing `.env.local`. Restart `npm run dev` after changes.

### Database prerequisites | متطلبات قاعدة البيانات

1. **Migrations applied** — especially `00007` (assignments + matching), `00019` (payments), `00021` (admin seed).
2. **Admin account exists** — see [Test accounts](#test-accounts--حسابات-الاختبار).
3. **At least one verified technician** with active skills — required for browse + auto-match.
4. **Services & categories seeded** — visible at `/services`.

### Critical business rules | قواعد مهمة

| Rule | Detail |
|------|--------|
| Technician must be **verified** | `technician_profiles.verification_status = 'verified'` — set by admin at `/admin/technicians` |
| Auto-match only finds **verified + available** techs | RPC `match_technicians_for_booking` |
| Browse API requires **service role key** | Without it, `/services` returns 503 for technician list |
| Chat opens after **accept** | DB trigger creates `chat_conversations` when booking → `accepted` |
| Payment needs **amount > 0** | Set `bookings.price_quote` or pass `amount` in payment API |
| Technician jobs (Available tab) | Shows **pending assignments**, not raw `pending` bookings |
| **Direct booking** | See [DIRECT-BOOKING.md](./DIRECT-BOOKING.md) — single technician assignment, skips auto-match RPC |

### Start the app | تشغيل التطبيق

```bash
cd "D:\Graduation Project 2025\Sanad"
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Test Accounts | حسابات الاختبار

### Admin (from migration `00021`)

| Field | Value |
|-------|-------|
| Email | `admin@sanad.app` |
| Password | `SanadAdmin2025!` |
| Login | `/auth/login` |
| Dashboard | `/admin` |

See also [docs/ADMIN-SETUP.md](./ADMIN-SETUP.md).

### Create test customer | إنشاء عميل تجريبي

1. Go to `/auth/register`
2. Choose **Customer / عميل**
3. Fill: name, email (e.g. `customer.test+1@example.com`), password (min 8 chars)
4. Confirm email if Supabase requires it (disable in Auth settings for local dev)
5. **Expected DB:** `profiles.role = 'customer'`, row in `auth.users`

**API verify:**

```http
GET /api/bookings
Authorization: Bearer <customer_access_token>
```

Returns `[]` initially.

### Create test technician | إنشاء صنايعي تجريبي

1. Go to `/auth/register-technician`
2. Complete signup: phone (`01xxxxxxxxx`), password, name, specialty, governorate, ID photos
3. **Expected DB:**
   - `profiles.role = 'technician'`
   - `technician_profiles.verification_status = 'pending'`
   - `technician_skills` rows for selected specialty services
4. **Admin must approve** before browse/match works → [Flow E](#flow-e--admin-approves-technician--payment--موافقة-الإدارة)

**Technician login:** same phone number at `/auth/login` (converted to internal email) or email if registered that way.

---

## DB & API Reference | مرجع قاعدة البيانات والـ API

### Booking status lifecycle

```
pending → matched → accepted → in_progress → completed
                  ↘ cancelled / disputed
```

| Status | `bookings.status` | Notes |
|--------|-------------------|-------|
| Created | `pending` | Before matching |
| Matched | `matched` | Assignments created |
| Accepted | `accepted` | `technician_id` set, chat available |
| In progress | `in_progress` | Admin or PATCH `/api/bookings/[id]` |
| Completed | `completed` | Enables review |

### Key tables

| Table | Key fields to check |
|-------|---------------------|
| `profiles` | `role`, `full_name`, `email`, `phone` |
| `technician_profiles` | `verification_status`, `is_available`, `governorate` |
| `technician_skills` | `technician_id`, `service_id`, `is_active` |
| `bookings` | `customer_id`, `service_id`, `technician_id`, `status`, `price_quote` |
| `booking_assignments` | `booking_id`, `technician_id`, `status` (`pending`/`accepted`/`rejected`) |
| `booking_images` | `booking_id`, `image_url` |
| `chat_conversations` | `booking_id` (created on accept) |
| `payments` | `booking_id`, `status` (`pending`/`approved`/`rejected`), `amount` |
| `reviews` | `booking_id` (unique), `rating`, `comment` |

### Key APIs

| Step | Method | Endpoint |
|------|--------|----------|
| Create booking | POST | `/api/bookings` |
| List customer bookings | GET | `/api/bookings` |
| Booking detail | GET | `/api/bookings/[id]` |
| Update booking status | PATCH | `/api/bookings/[id]` |
| Browse technicians | GET | `/api/technicians/browse` |
| Technician assignments | GET | `/api/technician/assignments?status=pending` |
| Accept/reject job | POST | `/api/technician/assignments/[id]/respond` |
| Chat messages | GET/POST | `/api/chat/conversations/[id]/messages` |
| Submit payment | POST | `/api/bookings/[id]/payment` |
| Approve payment | PATCH | `/api/admin/payments/[id]/approve` |
| Admin approve technician | PATCH | `/api/admin/technicians/[id]/status` |
| Submit review | POST | `/api/reviews` |
| Logout | POST | `/api/auth/signout` |

---

## Flow A — Customer signup → browse → book → accept → chat → pay → review
## المسار أ — تسجيل عميل → تصفح → حجز → قبول → محادثة → دفع → تقييم

### A1 — Customer manual signup | تسجيل عميل يدوي

| | |
|---|---|
| **URL** | `/auth/register` |
| **UI** | Role cards; fill name, email, password; submit |
| **Expected redirect** | `/services` or `/customer/bookings` |
| **DB** | `profiles`: new row, `role = 'customer'` |
| **API** | Supabase Auth signup (no REST route) |

### A2 — Browse services | تصفح الخدمات

| | |
|---|---|
| **URL** | `/services` |
| **UI** | Arabic technician cards, filters, map link |
| **DB** | Read-only: `technician_profiles` where `verification_status = 'verified'` |
| **API** | `GET /api/technicians/browse` → `{ technicians[], total }` |

**Pass criteria:** At least one verified technician visible. If empty → complete [Flow E1](#e1--approve-technician--الموافقة-على-الصنايعي).

### A3 — Create booking (general) | إنشاء حجز

| | |
|---|---|
| **URL** | `/customer/bookings/new` or via navbar "Book" |
| **UI** | Arabic booking form: category, service, description, map location, optional photos |
| **Submit** | Button **إرسال الطلب** |
| **Expected redirect** | `/customer/bookings/[id]` |
| **DB after submit** | |
| | `bookings`: new row, `status = 'pending'` then `'matched'` if techs found |
| | `booking_assignments`: up to 3 rows, `status = 'pending'` |
| | `booking_images`: optional rows |
| **API** | `POST /api/bookings` body: `{ service_id, description, location_address, location_lat, location_lng, image_urls[] }` |

**Verify match:**

```sql
SELECT status FROM bookings WHERE id = '<booking_id>';
SELECT technician_id, status FROM booking_assignments WHERE booking_id = '<booking_id>';
```

If `status` stays `pending` → no verified/available technician with matching skill. Approve tech ([E1](#e1--approve-technician--الموافقة-على-الصنايعي)).

### A4 — Technician accepts | قبول الصنايعي

| | |
|---|---|
| **URL (technician)** | `/technician/jobs` → tab **Available** → click job |
| **Detail URL** | `/technician/jobs/[assignment_id]` |
| **UI** | Accept / Decline buttons with 15-min timer |
| **Action** | Click **Accept** |
| **DB after accept** | |
| | `booking_assignments`: chosen row `status = 'accepted'`, others `cancelled` |
| | `bookings`: `status = 'accepted'`, `technician_id` set |
| | `chat_conversations`: new row for `booking_id` |
| **API** | `POST /api/technician/assignments/[id]/respond` `{ "action": "accept" }` |

### A5 — Chat | المحادثة

| | |
|---|---|
| **URL (customer)** | `/customer/bookings/[booking_id]/chat` |
| **URL (technician)** | `/technician/jobs/[booking_id]/chat` |
| **UI** | Real-time message thread |
| **DB** | `chat_messages` rows with `conversation_id` |
| **API** | `POST /api/chat/conversations/[id]/messages` `{ "content": "..." }` |

**Pass criteria:** Message appears for both parties within ~2s (Realtime).

### A6 — Mark in progress & complete | تحديث حالة الحجز

Use admin (fastest for QA):

| | |
|---|---|
| **URL** | `/admin/bookings/[booking_id]` |
| **Actions** | **Mark In Progress** → **Mark Completed** |
| **DB** | `bookings.status` → `in_progress` → `completed` |
| **API** | `PATCH /api/admin/bookings/[id]/status` `{ "status": "completed" }` |

### A7 — Payment | الدفع

**Prerequisite:** Set price on booking (Supabase SQL or Table Editor):

```sql
UPDATE bookings SET price_quote = 200.00 WHERE id = '<booking_id>';
```

| | |
|---|---|
| **URL** | `/customer/bookings/[booking_id]/payment` |
| **UI** | InstaPay / Vodafone Cash instructions, screenshot upload |
| **DB** | `payments`: `status = 'pending'`, `amount`, `screenshot_url` |
| **API** | `POST /api/bookings/[booking_id]/payment` `{ payment_method, screenshot_url, amount? }` |

Admin approves → [E2](#e2--approve-payment--الموافقة-على-الدفع).

### A8 — Review | التقييم

| | |
|---|---|
| **URL** | `/customer/bookings/[booking_id]/review` |
| **UI** | 1–5 stars + optional comment |
| **DB** | `reviews`: new row; trigger updates `technician_profiles.average_rating` |
| **API** | `POST /api/reviews` `{ booking_id, rating, comment? }` |

---

## Flow B — Google login → book from technician card
## المسار ب — Google → حجز من بطاقة صنايعي

**Prerequisite:** Google OAuth configured in Supabase (Client ID/secret, redirect `http://localhost:3000/api/auth/callback`).

### B1 — Google login as customer

| | |
|---|---|
| **URL** | `/auth/login` → **Google** |
| **Expected redirect** | `/services` (existing customer) or role selection (new user) |
| **DB** | `auth.users` + `profiles` with `role = 'customer'` |

### B2 — Book from technician card

| | |
|---|---|
| **URL** | `/services` → click **احجز مع هذا الفني** on a card (or avatar/name / map **احجز الآن**) |
| **Redirect** | `/customer/bookings/new?service_id=<uuid>&technician_id=<uuid>` |
| **UI** | Banner "أنت تحجز مع: [name]" with avatar, specialty, rating; service read-only |
| **DB after submit** | Single `booking_assignments` row for that `technician_id`; `bookings.status = 'matched'` |
| **API** | `POST /api/bookings` includes `technician_id` |

**Verify direct assignment (no auto-match to other techs):**

```sql
SELECT COUNT(*) FROM booking_assignments
WHERE booking_id = '<id>' AND status = 'pending';
-- Expected: 1
```

Continue from [A4](#a4--technician-accepts--قبول-الصنايعي).

---

## Flow C — Technician manual signup → admin approve → receives assignment
## المسار ج — تسجيل صنايعي → موافقة الإدارة → استلام طلب

### C1 — Technician signup

| | |
|---|---|
| **URL** | `/auth/register-technician` |
| **UI** | Multi-step Arabic form: phone, password, specialty, governorate, ID upload |
| **DB** | `profiles.role = 'technician'`, `technician_profiles.verification_status = 'pending'` |
| **API** | `POST /api/auth/register-technician` |

### C2 — Admin approves

See [E1](#e1--approve-technician--الموافقة-على-الصنايعي).

### C3 — Technician receives assignment

1. Customer creates booking ([A3](#a3--create-booking-general--إنشاء-حجز)) matching technician's skill category.
2. Technician logs in → `/technician/jobs` → **Available** tab.
3. **DB:** `booking_assignments.technician_id = <tech_id>`, `status = 'pending'`.
4. **API:** `GET /api/technician/assignments?status=pending`

---

## Flow D — Technician Google signup → complete profile → jobs
## المسار د — Google للصنايعي → إكمال الملف → الوظائف

### D1 — Google signup as technician

| | |
|---|---|
| **URL** | `/auth/register-technician` → Google (or login page with `?role=technician`) |
| **Expected redirect** | `/auth/register-technician?complete=1` if profile incomplete |
| **DB** | `profiles.role = 'technician'` (from metadata or completion form) |

### D2 — Complete profile

| | |
|---|---|
| **URL** | `/auth/register-technician?complete=1` |
| **UI** | Remaining fields: national ID, photos, skills |
| **DB** | `technician_profiles` filled; `verification_status = 'pending'` |

### D3 — After admin approval

| | |
|---|---|
| **URL** | `/technician/jobs` |
| **UI** | Jobs list when assignments exist |
| **Redirect after login** | `/technician/jobs` when profile complete |

---

## Flow E — Admin approves technician & payment
## المسار هـ — موافقة الإدارة على الصنايعي والدفع

### E1 — Approve technician | الموافقة على الصنايعي

| | |
|---|---|
| **URL** | `/admin/technicians` → click technician → **Approve** |
| **UI** | Status badge changes to `verified` |
| **DB** | `technician_profiles.verification_status = 'verified'` |
| **API** | `PATCH /api/admin/technicians/[id]/status` `{ "action": "approve" }` |

**Verify browse:**

```http
GET /api/technicians/browse
```

Technician appears in list.

### E2 — Approve payment | الموافقة على الدفع

| | |
|---|---|
| **URL** | `/admin/payments` → pending row → **Approve** |
| **UI** | Status → `approved` |
| **DB** | `payments.status = 'approved'`, `verified_by`, `verified_at` |
| **API** | `PATCH /api/admin/payments/[id]/approve` |

---

## Flow F — Logout / login between steps
## المسار و — تسجيل الخروج والدخول بين الخطوات

### F1 — Logout

| | |
|---|---|
| **URL** | User menu → Log out, or `/settings/security` → Log out / Log out all devices |
| **UI** | Redirect to `/auth/login` |
| **API** | `POST /api/auth/signout` `{ "scope": "local" \| "global" }` |

### F2 — Login as different role

| | |
|---|---|
| **URL** | `/auth/login?next=/customer/bookings/new` (preserves redirect) |
| **UI** | Email/password or Google |
| **Expected** | Middleware routes by `profiles.role`: customer → bookings, technician → jobs, admin → `/admin` |

**Test matrix:**

| From | Logout | Login as | Expected landing |
|------|--------|----------|------------------|
| Customer | ✅ | Technician | `/technician/jobs` |
| Technician | ✅ | Admin | `/admin` |
| Admin | ✅ | Customer | `/services` |

---

## Troubleshooting | استكشاف الأخطاء

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/services` empty / 503 | Missing `SUPABASE_SERVICE_ROLE_KEY` | Add to `.env.local`, restart dev |
| Booking stays `pending` | No verified tech with matching skill | Admin approve technician + check `technician_skills` |
| Technician sees no jobs | Looking at wrong tab or not verified | Use **Available** tab; verify `booking_assignments` in DB |
| Direct book assigns wrong tech | Missing `technician_id` in URL | Use `/customer/bookings/new?service_id=X&technician_id=Y` |
| Chat unavailable | Booking not `accepted` | Technician must accept first |
| Payment form missing | `price_quote` is null/0 | `UPDATE bookings SET price_quote = ...` |
| Google login fails | OAuth not configured | Supabase Dashboard → Authentication → Google |

---

## Verification commands | أوامر التحقق

```bash
# Build (must pass before release)
npm run build

# Lint (no new errors)
npm run lint
```

### Quick API smoke (replace tokens & IDs)

```bash
# Browse technicians
curl -s "http://localhost:3000/api/technicians/browse?limit=5" | jq '.total'

# Create booking (customer session cookie or Bearer token required)
curl -s -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{"service_id":"<uuid>","description":"Test booking flow minimum ten chars","location_address":"Cairo, Egypt","location_lat":30.0444,"location_lng":31.2357,"image_urls":[],"technician_id":"<optional-tech-uuid>"}'
```

---

## Related docs

- [ADMIN-SETUP.md](./ADMIN-SETUP.md) — Admin bootstrap credentials
- [LAUNCH-AUDIT.md](./LAUNCH-AUDIT.md) — Feature completeness matrix
- [RATE-LIMITING.md](./RATE-LIMITING.md) — API rate limits (if enabled)
