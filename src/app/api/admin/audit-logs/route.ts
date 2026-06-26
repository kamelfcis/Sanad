import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { auditLogsQuerySchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, auditLogsQuerySchema);
  if ('response' in query) return query.response;

  const { entity_type: entityType, action } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('audit_logs')
    .select('*, admin:profiles!admin_id(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (entityType) dbQuery = dbQuery.eq('entity_type', entityType);
  if (action) dbQuery = dbQuery.eq('action', action);

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, limit });
}
