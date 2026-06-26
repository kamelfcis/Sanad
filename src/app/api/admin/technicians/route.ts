import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminTechniciansQuerySchema } from '@/lib/validations/technicians';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminTechniciansQuerySchema);
  if ('response' in query) return query.response;

  const { search, status } = query.data;
  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('technician_profiles')
    .select(
      `
      *,
      profile:profiles!inner(id, full_name, email, phone, avatar_url, created_at),
      skills:technician_skills(count)
    `,
      { count: 'exact' },
    );

  if (status) dbQuery = dbQuery.eq('verification_status', status);
  if (search) {
    dbQuery = dbQuery.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`);
  }

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const transformed = data?.map((t: Record<string, unknown>) => ({
    ...t,
    skills_count: (t.skills as { count: number }[])?.[0]?.count ?? 0,
    skills: undefined,
  }));

  return NextResponse.json({
    technicians: transformed ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
