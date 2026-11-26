import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth, requireAdmin } from '@/lib/api/auth';
import { adminEntityIdSchema } from '@/lib/validations/admin';
import { KYC_BUCKET } from '@/lib/storage/constants';

const KYC_SIGNED_URL_TTL_SECONDS = 10 * 60;

function getKycStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/${KYC_BUCKET}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex < 0) return null;

  try {
    return decodeURIComponent(value.slice(markerIndex + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}

async function signKycUrl(
  service: ReturnType<typeof createServiceRoleClient>,
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;
  const path = getKycStoragePath(value);
  if (!path) return value;

  const { data, error } = await service.storage
    .from(KYC_BUCKET)
    .createSignedUrl(path, KYC_SIGNED_URL_TTL_SECONDS);
  return error ? null : data?.signedUrl ?? null;
}

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
      profile:profiles!inner(
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        is_blocked,
        blocked_reason
      ),
      skills:technician_skills(
        price_override,
        is_active,
        service:services(
          id,
          name_ar,
          name_en,
          slug,
          category:service_categories(name_ar, name_en, slug)
        )
      )
    `,
    )
    .eq('id', id)
    .maybeSingle();

  if (techErr) return NextResponse.json({ error: techErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Technician not found' }, { status: 404 });

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Private identity document access is not configured.' }, { status: 503 });
  }
  const service = createServiceRoleClient();
  const [idCardPhotoUrl, idCardBackPhotoUrl, verificationDocs] = await Promise.all([
    signKycUrl(service, row.id_card_photo_url),
    signKycUrl(service, row.id_card_back_photo_url),
    Promise.all((row.verification_docs ?? []).map((url: string) => signKycUrl(service, url))),
  ]);

  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name_ar, name_en), customer:profiles!customer_id(full_name, phone)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, customer:profiles!customer_id(full_name, avatar_url)')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    id: row.id,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    bio: row.bio,
    years_experience: row.years_experience,
    national_id: row.national_id,
    governorate: row.governorate,
    area: row.area,
    starting_price: row.starting_price,
    working_hours: row.working_hours,
    profile_photo_url: row.profile_photo_url,
    id_card_photo_url: idCardPhotoUrl,
    id_card_back_photo_url: idCardBackPhotoUrl,
    verification_docs: verificationDocs,
    verification_status: row.verification_status,
    is_available: row.is_available,
    max_distance_km: row.max_distance_km,
    completed_jobs: row.completed_jobs,
    average_rating: row.average_rating,
    total_ratings: row.total_ratings,
    provider_role: row.provider_role,
    contractor_kind: row.contractor_kind,
    capacity_tier: row.capacity_tier,
    team_size: row.team_size,
    created_at: profile?.created_at ?? row.created_at,
    is_blocked: profile?.is_blocked ?? null,
    blocked_reason: profile?.blocked_reason ?? null,
    skills: row.skills ?? [],
    bookings: bookings ?? [],
    reviews: reviews ?? [],
  });
}
