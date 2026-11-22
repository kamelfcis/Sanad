import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { parseSearchParams } from '@/lib/api/validate';
import { adminTechniciansQuerySchema } from '@/lib/validations/technicians';
import { specialtyArabicLabel } from '@/lib/constants/technician-registration';

type ProfileRow = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  is_blocked?: boolean | null;
  blocked_reason?: string | null;
  role?: string | null;
};

type SkillRow = {
  is_active?: boolean | null;
  service?: {
    name_ar?: string | null;
    name_en?: string | null;
    slug?: string | null;
    category?: {
      name_ar?: string | null;
      name_en?: string | null;
      slug?: string | null;
    } | null;
  } | null;
};

function firstRecord<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

function primaryTrade(skills: SkillRow[] | null | undefined): {
  specialty_label: string | null;
  specialty_slug: string | null;
} {
  const list = skills ?? [];
  const active = list.filter((skill) => skill.is_active !== false);
  const skill = firstRecord(active.length ? active : list);
  const service = firstRecord(skill?.service ?? null);
  const category = firstRecord(service?.category ?? null);
  const slug = category?.slug ?? service?.slug ?? null;
  return {
    specialty_label:
      specialtyArabicLabel(slug) ?? category?.name_ar ?? service?.name_ar ?? null,
    specialty_slug: slug,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const query = parseSearchParams(request.nextUrl.searchParams, adminTechniciansQuerySchema);
  if ('response' in query) return query.response;

  const { search, status, page, limit } = query.data;
  const offset = (page - 1) * limit;
  const db = isServiceRoleConfigured() ? createServiceRoleClient() : supabase;

  let dbQuery = db
    .from('technician_profiles')
    .select(
      `
      id,
      verification_status,
      completed_jobs,
      average_rating,
      created_at,
      provider_role,
      contractor_kind,
      capacity_tier,
      team_size,
      profile_photo_url,
      profile:profiles!inner(
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        is_blocked,
        blocked_reason,
        role
      ),
      skills:technician_skills(
        is_active,
        service:services(
          name_ar,
          name_en,
          slug,
          category:service_categories(name_ar, name_en, slug)
        )
      )
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

  const technicians = (data ?? []).map((row) => {
    const profile = firstRecord(row.profile as ProfileRow | ProfileRow[] | null);
    const trade = primaryTrade(row.skills as SkillRow[] | null);
    return {
      id: row.id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      avatar_url: row.profile_photo_url ?? profile?.avatar_url ?? null,
      verification_status: row.verification_status,
      completed_jobs: row.completed_jobs,
      average_rating: row.average_rating,
      created_at: profile?.created_at ?? row.created_at ?? null,
      provider_role: row.provider_role ?? 'technician',
      contractor_kind: row.contractor_kind ?? null,
      capacity_tier: row.capacity_tier ?? null,
      team_size: row.team_size ?? null,
      specialty_label: trade.specialty_label,
      specialty_slug: trade.specialty_slug,
      is_blocked: profile?.is_blocked ?? null,
      blocked_reason: profile?.blocked_reason ?? null,
      role: profile?.role ?? null,
    };
  });

  return NextResponse.json({
    technicians,
    total: count ?? 0,
    page,
    limit,
  });
}
