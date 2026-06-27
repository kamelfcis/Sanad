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

  type ProfileJoin = {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };

  const transformed = data?.map((row: Record<string, unknown>) => {
    const profile = row.profile as ProfileJoin | null;
    const skills = row.skills as { count: number }[] | undefined;
    const tech = { ...row };
    delete tech.profile;
    delete tech.skills;

    return {
      ...tech,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: profile?.created_at ?? tech.created_at,
      skills_count: skills?.[0]?.count ?? 0,
    };
  });

  return NextResponse.json({
    technicians: transformed ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
