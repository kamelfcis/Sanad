import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { FooterSection } from '@/components/landing/footer';
import { ReviewCard } from '@/components/shared/review-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { pageMetadata } from '@/lib/seo';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { transformBrowseTechnician, type RawTechnicianRow } from '@/lib/technicians/browse';
import { buildNewBookingHref } from '@/lib/booking/booking-links';
import { toTelHref } from '@/lib/utils/phone';

export const revalidate = 60;

async function loadTechnician(id: string) {
  if (!isServiceRoleConfigured()) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('technician_profiles')
    .select(
      `
      id,
      governorate,
      area,
      bio,
      years_experience,
      working_hours,
      starting_price,
      is_available,
      verification_status,
      is_demo,
      average_rating,
      completed_jobs,
      profile_photo_url,
      profile:profiles!inner(full_name, avatar_url, phone),
      skills:technician_skills(
        is_active,
        price_override,
        services(
          id,
          price,
          service_categories(slug, name_ar)
        )
      )
    `,
    )
    .eq('id', id)
    .eq('verification_status', 'verified')
    .eq('is_demo', false)
    .maybeSingle();

  if (error || !data) return null;

  const record = data as unknown as RawTechnicianRow & {
    bio?: string | null;
    years_experience?: number | null;
    working_hours?: string | null;
    profile: RawTechnicianRow['profile'] | NonNullable<RawTechnicianRow['profile']>[];
  };

  const row: RawTechnicianRow = {
    ...record,
    profile: Array.isArray(record.profile) ? record.profile[0] ?? null : record.profile,
  };

  const technician = transformBrowseTechnician(row);
  if (!technician) return null;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, customer:profiles!customer_id(full_name, avatar_url)')
    .eq('technician_id', id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(20);

  return { technician, reviews: reviews ?? [], bio: record.bio, years: record.years_experience, hours: record.working_hours };
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const payload = await loadTechnician(id);
  if (!payload) return pageMetadata('صنايعي غير موجود', undefined, `/technicians/${id}`);
  return pageMetadata(
    payload.technician.full_name ?? 'صنايعي',
    `${payload.technician.specialty_label ?? 'صنايعي'} — ${payload.technician.governorate ?? 'مصر'}`,
    `/technicians/${id}`,
  );
}

export default async function PublicTechnicianProfilePage({ params }: PageProps) {
  const { id } = await params;
  const payload = await loadTechnician(id);
  if (!payload) notFound();

  const { technician, reviews, bio, years, hours } = payload;
  const profileHref = `/technicians/${technician.id}`;
  const bookingHref = buildNewBookingHref({
    serviceId: technician.primary_service_id,
    technicianId: technician.id,
  });
  const initials = (technician.full_name ?? 'ص')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background pt-20 md:pt-24" dir="rtl">
        <div className="container max-w-3xl space-y-8 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarImage src={technician.avatar_url ?? undefined} alt={technician.full_name ?? 'صنايعي'} width={80} height={80} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-text-primary">{technician.full_name}</h1>
              <p className="mt-1 text-text-secondary">
                {technician.specialty_label}
                {technician.governorate ? ` · ${technician.governorate}` : ''}
                {technician.area ? ` · ${technician.area}` : ''}
              </p>
              {technician.phone?.trim() ? (
                <a
                  href={toTelHref(technician.phone)}
                  dir="ltr"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`اتصل بـ ${technician.full_name ?? 'الصنايعي'} على ${technician.phone}`}
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{technician.phone}</span>
                </a>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {technician.completed_jobs} شغلة · تقييم {technician.average_rating.toFixed(1)}
              </p>
              {bio && <p className="mt-4 text-sm leading-relaxed text-text-secondary">{bio}</p>}
              {(years || hours) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {years ? `${years} سنوات خبرة` : ''}
                  {years && hours ? ' · ' : ''}
                  {hours ?? ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="bg-primary-strong hover:bg-primary-strong/90"
              disabled={!technician.is_available}
              aria-disabled={!technician.is_available}
            >
              <Link href={technician.is_available ? bookingHref : '#'} aria-disabled={!technician.is_available}>
                {technician.is_available ? 'احجز مع هذا الصنايعي' : 'غير متاح الآن'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">العودة للتصفح</Link>
            </Button>
          </div>

          <section aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="text-xl font-bold">
              التقييمات
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">لا توجد تقييمات عامة بعد.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <ReviewCard
                      rating={review.rating}
                      comment={review.comment}
                      createdAt={review.created_at}
                      customerName={(review.customer as { full_name?: string | null } | null)?.full_name ?? 'عميل'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
