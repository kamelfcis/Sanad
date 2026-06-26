/**
 * Query Supabase for E2E verification evidence.
 * Run: npx tsx --env-file=.env.local scripts/verify-e2e-db.ts [customerEmail]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const usersPath = join(process.cwd(), 'e2e', 'test-users.json');
  const users = JSON.parse(readFileSync(usersPath, 'utf8')) as {
    customer: { id: string; email: string };
    technician: { id: string };
  };

  const customerId = users.customer.id;
  const techId = users.technician.id;

  const queries = {
    profiles: await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .in('email', [users.customer.email, 'admin@sanad.app'])
      .limit(10),
    technicianProfile: await supabase
      .from('technician_profiles')
      .select('id, verification_status, is_available')
      .eq('id', techId)
      .maybeSingle(),
    bookings: await supabase
      .from('bookings')
      .select('id, status, customer_id, technician_id, price_quote, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5),
    assignments: await supabase
      .from('booking_assignments')
      .select('id, booking_id, technician_id, status, response_at')
      .eq('technician_id', techId)
      .order('created_at', { ascending: false })
      .limit(10),
    conversations: await supabase
      .from('chat_conversations')
      .select('id, booking_id, customer_id, technician_id')
      .or(`customer_id.eq.${customerId},technician_id.eq.${techId}`)
      .limit(10),
    messages: await supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    payments: await supabase
      .from('payments')
      .select('id, booking_id, status, amount, payment_method')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5),
    notifications: await supabase
      .from('notifications')
      .select('id, user_id, type, title, read_at, created_at')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10),
    reviews: await supabase
      .from('reviews')
      .select('id, booking_id, rating, comment')
      .eq('customer_id', customerId)
      .limit(5),
    auditLogs: await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  };

  const output = {
    verifiedAt: new Date().toISOString(),
    customerId,
    techId,
    results: Object.fromEntries(
      Object.entries(queries).map(([k, v]) => [k, { data: v.data, error: v.error?.message ?? null }]),
    ),
  };

  writeFileSync(join(process.cwd(), 'e2e', 'db-verification.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
