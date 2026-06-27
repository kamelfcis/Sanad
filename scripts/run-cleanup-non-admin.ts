/**
 * Remove all users and transactional data except admin@sanad.app.
 * Preserves catalog: service_categories, services, hero_slides, payment_settings.
 *
 * Run: npx tsx --env-file=.env.local scripts/run-cleanup-non-admin.ts
 */
import { createClient } from '@supabase/supabase-js';
import { join } from 'path';

const ADMIN_EMAIL = 'admin@sanad.app';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function deleteAll(
  supabase: ReturnType<typeof createClient>,
  table: string,
  column?: string,
  neqValue?: string,
) {
  let query = supabase.from(table).delete({ count: 'exact' });
  if (column && neqValue) {
    query = query.neq(column, neqValue);
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { error, count } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminList } = await supabase.auth.admin.listUsers();
  const admin = adminList?.users?.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) {
    throw new Error(`ABORT: Admin user ${ADMIN_EMAIL} not found`);
  }
  const adminId = admin.id;

  const report: Record<string, number | string> = { admin_preserved: adminId };

  const tablesAll = [
    'chat_messages',
    'chat_conversations',
    'reviews',
    'payments',
    'booking_assignments',
    'booking_images',
    'bookings',
    'audit_logs',
  ] as const;

  for (const table of tablesAll) {
    report[table] = await deleteAll(supabase, table);
  }

  report.notifications = await deleteAll(supabase, 'notifications', 'user_id', adminId);

  const { count: techSkillsDeleted, error: tsErr } = await supabase
    .from('technician_skills')
    .delete({ count: 'exact' })
    .neq('technician_id', adminId);
  if (tsErr) throw new Error(`technician_skills: ${tsErr.message}`);
  report.technician_skills = techSkillsDeleted ?? 0;

  const { count: tpDeleted, error: tpErr } = await supabase
    .from('technician_profiles')
    .delete({ count: 'exact' })
    .neq('id', adminId);
  if (tpErr) throw new Error(`technician_profiles: ${tpErr.message}`);
  report.technician_profiles = tpDeleted ?? 0;

  const nonAdminUsers: string[] = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data.users.filter((u) => u.id !== adminId);
    nonAdminUsers.push(...batch.map((u) => u.id));
    if (data.users.length < perPage) break;
    page += 1;
  }

  let authDeleted = 0;
  for (const userId of nonAdminUsers) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`deleteUser ${userId}: ${error.message}`);
    } else {
      authDeleted += 1;
    }
  }
  report.auth_users_deleted = authDeleted;

  const { data: finalUsers } = await supabase.auth.admin.listUsers();
  const { count: categoriesCount } = await supabase
    .from('service_categories')
    .select('id', { count: 'exact', head: true });
  const { count: servicesCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true });
  const { count: heroCount } = await supabase
    .from('hero_slides')
    .select('id', { count: 'exact', head: true });

  report.verification = JSON.stringify({
    auth_users_remaining: finalUsers?.users?.length ?? 0,
    remaining_email: finalUsers?.users?.[0]?.email ?? null,
    service_categories: categoriesCount,
    services: servicesCount,
    hero_slides: heroCount,
  });

  const outPath = join(process.cwd(), 'e2e', 'cleanup-report.json');
  const { writeFileSync, mkdirSync } = await import('fs');
  mkdirSync(join(process.cwd(), 'e2e'), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ cleanedAt: new Date().toISOString(), report }, null, 2));

  console.log('Cleanup complete:', JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
