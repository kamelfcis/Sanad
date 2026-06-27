/**
 * Ensure E2E technician is verified and available (for chat/direct-booking tests).
 * Run: npx tsx --env-file=.env.local scripts/ensure-e2e-tech-ready.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const users = JSON.parse(readFileSync(join(process.cwd(), 'e2e', 'test-users.json'), 'utf8'));
  const techId = users.technician?.id as string | undefined;
  if (!techId) throw new Error('No technician id in e2e/test-users.json — run seed:e2e first');

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await supabase
    .from('technician_profiles')
    .update({
      verification_status: 'verified',
      is_available: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', techId);

  if (error) throw error;
  console.log(`Technician ${techId} ready (verified + available)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
