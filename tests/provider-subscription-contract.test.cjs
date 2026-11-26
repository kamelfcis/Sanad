const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/00039_provider_subscriptions.sql');
const paymentApi = read('src/app/api/technician/subscription/route.ts');
const adminApi = read('src/app/api/admin/provider-subscription-payments/[id]/route.ts');
const browse = read('src/lib/technicians/browse-query.ts');
const bookingApi = read('src/app/api/bookings/route.ts');
const quoteApi = read('src/app/api/quote-requests/route.ts');
const profileApi = read('src/app/api/technician/profile/route.ts');
const subscriptionUi = read('src/components/technician/subscription-management.tsx');
const availabilityUi = read('src/components/technician/availability-card.tsx');
const registrationUi = read('src/components/auth/technician-registration-form.tsx');
const subscriptionHook = read('src/hooks/use-provider-subscription.ts');
const adminListUi = read('src/app/admin/provider-subscriptions/page.tsx');
const publicTechnicianApi = read('src/app/api/technicians/[id]/route.ts');
const adminTechnicianApi = read('src/app/api/admin/technicians/[id]/route.ts');

test('subscription fee, renewal period, and one-pending-request rule are fixed in the database', () => {
  assert.match(migration, /amount NUMERIC\(10, 2\) NOT NULL DEFAULT 10\.00 CHECK \(amount = 10\.00\)/);
  assert.match(migration, /interval '1 month'/);
  assert.match(migration, /provider_subscription_one_pending_payment_idx[\s\S]*WHERE status = 'pending'/);
});

test('receipt storage is private, size-limited, and tables have RLS', () => {
  assert.match(migration, /'provider-subscription-receipts',[\s\S]*false,[\s\S]*5242880/);
  assert.match(migration, /ALTER TABLE public\.provider_subscriptions ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /ALTER TABLE public\.provider_subscription_payments ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /provider_subscription_receipts_admin_read/);
});

test('review is admin-checked, atomic, and accepts only pending payment records', () => {
  assert.match(migration, /WHERE id = p_admin_id AND role = 'admin'/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /payment_already_reviewed/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.review_provider_subscription_payment[\s\S]*TO service_role/);
  assert.match(adminApi, /requireAdmin/);
  assert.match(adminApi, /review_provider_subscription_payment/);
});

test('provider receipt flow validates files, uploads directly, and records only stored objects', () => {
  assert.match(paymentApi, /PROVIDER_SUBSCRIPTION_RECEIPT_MAX_BYTES/);
  assert.match(paymentApi, /PROVIDER_SUBSCRIPTION_RECEIPT_MIME_TYPES/);
  assert.match(paymentApi, /\.eq\('status', 'pending'\)/);
  assert.match(paymentApi, /createSignedUploadUrl/);
  assert.match(paymentApi, /export async function PATCH/);
  assert.match(paymentApi, /export async function DELETE/);
  assert.match(paymentApi, /status: 'pending'/);
  assert.doesNotMatch(paymentApi, /verification_status !== 'verified'/);
});

test('inactive providers are hidden and blocked from availability, booking, and quote workflows', () => {
  assert.match(profileApi, /PROVIDER_SUBSCRIPTION_REQUIRED/);
  assert.match(profileApi, /if \(is_available === true\)/);
  assert.match(profileApi, /\.update\(updates\)/);
  assert.match(browse, /provider_subscriptions/);
  assert.match(browse, /\.gt\('active_until'/);
  assert.match(browse, /\.eq\('is_available', true\)/);
  assert.match(bookingApi, /PROVIDER_SUBSCRIPTION_REQUIRED/);
  assert.match(quoteApi, /provider_subscriptions/);
  assert.match(quoteApi, /status: 402/);
  assert.match(quoteApi, /is_available/);
  assert.match(publicTechnicianApi, /\.eq\('is_available', true\)/);
  assert.match(publicTechnicianApi, /provider_subscriptions/);
});

test('registration lets the provider choose to pay now or later', () => {
  assert.match(registrationUi, /InitialPaymentChoice = 'now' \| 'later'/);
  assert.match(registrationUi, /setInitialPaymentChoice/);
  assert.match(registrationUi, /technician\/subscription\?start=1/);
  assert.match(registrationUi, /auth\/login\?next=/);
});

test('provider and admin screens show receipt review, approval, and visibility status', () => {
  assert.match(subscriptionUi, /PROVIDER_INSTAPAY_URL/);
  assert.match(subscriptionUi, /PROVIDER_SUBSCRIPTION_SUPPORT_PHONE/);
  assert.match(subscriptionUi, /PROVIDER_SUBSCRIPTION_SUPPORT_WHATSAPP/);
  assert.match(subscriptionUi, /تم تفعيل الاشتراك/);
  assert.match(subscriptionHook, /uploadToSignedUrl/);
  assert.match(subscriptionHook, /refetchInterval/);
  assert.match(availabilityUi, /disabled=\{!canToggle/);
  assert.match(availabilityUi, /ظهور الملف الشخصي/);
  assert.match(adminListUi, /<img src=\{payment\.receiptUrl\}/);
  assert.match(adminListUi, /قبول وتفعيل الاشتراك/);
});

test('admin technician details return signed URLs for private identity documents', () => {
  assert.match(adminTechnicianApi, /KYC_SIGNED_URL_TTL_SECONDS/);
  assert.match(adminTechnicianApi, /createSignedUrl\(path, KYC_SIGNED_URL_TTL_SECONDS\)/);
  assert.match(adminTechnicianApi, /id_card_photo_url: idCardPhotoUrl/);
  assert.match(adminTechnicianApi, /id_card_back_photo_url: idCardBackPhotoUrl/);
  assert.match(adminTechnicianApi, /verification_docs: verificationDocs/);
});
