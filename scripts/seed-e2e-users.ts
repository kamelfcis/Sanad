/**
 * Seed E2E test accounts (dev/staging only).
 * Run: npx tsx --env-file=.env.local scripts/seed-e2e-users.ts
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { phoneToTechnicianEmail } from '../src/lib/constants/technician-registration';

const CUSTOMER = {
  email: 'test-customer@sanad.app',
  password: 'TestCustomer2025!',
  fullName: 'E2E Test Customer',
  phone: '01122334455',
};

/** Dedicated E2E technician — complete profile, pending admin approval */
const TECH = {
  phone: '01111734655',
  password: 'TestTech2025!',
  fullName: 'E2E Test Technician',
  nationalId: '29001011234567',
  specialty: 'electrical',
  yearsExperience: 5,
  governorate: 'القاهرة',
  area: 'مدينة نصر',
  startingPrice: 150,
  workingHours: '9 ص - 6 م',
  bio: 'فني كهرباء محترف للاختبار الآلي E2E — خبرة في التمديدات والصيانة.',
};

/** Default verified so full-workflow booking tests pass; technician-admin-workflow resets to pending */
const TECH_SEED_PENDING = process.env.E2E_TECH_PENDING === 'true';

const PLACEHOLDER_PHOTO =
  'https://placehold.co/400x400/png?text=E2E+Profile';
const PLACEHOLDER_ID =
  'https://placehold.co/800x500/png?text=E2E+ID';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function ensureUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  metadata: Record<string, unknown>,
) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return data.user.id;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const customerId = await ensureUser(supabase, CUSTOMER.email, CUSTOMER.password, {
    full_name: CUSTOMER.fullName,
    role: 'customer',
  });

  await supabase.from('profiles').upsert(
    {
      id: customerId,
      email: CUSTOMER.email,
      full_name: CUSTOMER.fullName,
      phone: CUSTOMER.phone,
      role: 'customer',
      avatar_url: PLACEHOLDER_PHOTO,
    },
    { onConflict: 'id' },
  );

  const techEmail = phoneToTechnicianEmail(TECH.phone);
  const techId = await ensureUser(supabase, techEmail, TECH.password, {
    full_name: TECH.fullName,
    role: 'technician',
    phone: TECH.phone,
  });

  await supabase.from('profiles').upsert(
    {
      id: techId,
      email: techEmail,
      full_name: TECH.fullName,
      phone: TECH.phone,
      role: 'technician',
      avatar_url: PLACEHOLDER_PHOTO,
    },
    { onConflict: 'id' },
  );

  await supabase.from('technician_profiles').upsert(
    {
      id: techId,
      bio: TECH.bio,
      years_experience: TECH.yearsExperience,
      national_id: TECH.nationalId,
      governorate: TECH.governorate,
      area: TECH.area,
      starting_price: TECH.startingPrice,
      working_hours: TECH.workingHours,
      profile_photo_url: PLACEHOLDER_PHOTO,
      id_card_photo_url: PLACEHOLDER_ID,
      id_document_url: PLACEHOLDER_ID,
      verification_docs: [PLACEHOLDER_ID],
      verification_status: TECH_SEED_PENDING ? 'pending' : 'verified',
      is_available: false,
      location_lat: 30.0444,
      location_lng: 31.2357,
    },
    { onConflict: 'id' },
  );

  const { data: category } = await supabase
    .from('service_categories')
    .select('id')
    .eq('slug', 'electrical')
    .maybeSingle();

  let serviceId: string | null = null;
  if (category) {
    const { data: service } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    serviceId = service?.id ?? null;

    if (serviceId) {
      await supabase.from('technician_skills').upsert(
        {
          technician_id: techId,
          service_id: serviceId,
          price_override: TECH.startingPrice,
          is_active: true,
        },
        { onConflict: 'technician_id,service_id' },
      );
    }
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'admin@sanad.app')
    .maybeSingle();

  const output = {
    seededAt: new Date().toISOString(),
    customer: { id: customerId, email: CUSTOMER.email, password: CUSTOMER.password },
    technician: {
      id: techId,
      email: techEmail,
      phone: TECH.phone,
      password: TECH.password,
    },
    admin: {
      id: adminProfile?.id ?? null,
      email: 'admin@sanad.app',
      password: 'SanadAdmin2025!',
    },
    serviceId,
    techSkillCategory: 'electrical',
  };

  mkdirSync(join(process.cwd(), 'e2e'), { recursive: true });
  writeFileSync(join(process.cwd(), 'e2e', 'test-users.json'), JSON.stringify(output, null, 2));

  console.log('E2E users seeded:', JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
