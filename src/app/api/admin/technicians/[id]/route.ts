import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';

type ProfileJoin = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type SkillJoin = {
  price_override: number | null;
  is_active: boolean;
  service: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    category: {
      name_ar: string;
      name_en: string;
      slug: string;
    } | null;
  } | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const idParsed = adminEntityIdSchema.safeParse(rawParams);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid technician ID' }, { status: 400 });
  }
  const { id } = idParsed.data;

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;

  const { data: row, error: techErr } = await supabase
    .from('technician_profiles')
    .select(
      `
      *,
      profile:profiles!inner(id, full_name, email, phone, avatar_url, created_at),
      skills:technician_skills(
        price_override, is_active,
        service:services(id, name_ar, name_en, slug,
          category:service_categories(name_ar, name_en, slug))
      )
    `,
    )
    .eq('id', id)
    .single();

  if (techErr) return NextResponse.json({ error: techErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Technician not found' }, { status: 404 });

  const profile = row.profile as ProfileJoin | null;
  const skills = (row.skills as SkillJoin[] | null) ?? [];
  const tech = { ...row } as Record<string, unknown>;
  delete tech.profile;
  delete tech.skills;

  const technician = {
    ...tech,
    id: profile?.id ?? id,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? tech.created_at,
    skills,
  };

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name_ar, name_en), customer:profiles!bookings_customer_id_fkey(full_name, phone)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    ...technician,
    bookings: bookings ?? [],
    reviews: reviews ?? [],
  });
}
