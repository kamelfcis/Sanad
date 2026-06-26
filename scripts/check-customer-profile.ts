import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('email', 'test-customer@sanad.app')
    .single();

  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
