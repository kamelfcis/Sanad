'use client';

import { AdminEntityCardInfoBox, AdminEntityCardInfoRow } from '@/components/admin/admin-list-chrome';
import type { AdminTechnicianDetail } from '@/hooks/use-admin';
import type { AdminTranslator } from '@/lib/i18n/admin/types';

interface TechnicianReviewSectionsProps {
  tech: AdminTechnicianDetail;
  t: AdminTranslator;
  formatDate: (iso: string) => string;
  formatCurrency: (value: number) => string;
  locale: 'ar' | 'en';
}

function serviceName(
  skill: AdminTechnicianDetail['skills'][number],
  locale: 'ar' | 'en',
): string {
  if (!skill.service) return '—';
  return locale === 'ar' ? skill.service.name_ar : skill.service.name_en;
}

function categoryName(
  skill: AdminTechnicianDetail['skills'][number],
  locale: 'ar' | 'en',
): string | null {
  const cat = skill.service?.category;
  if (!cat) return null;
  return locale === 'ar' ? cat.name_ar : cat.name_en;
}

export function TechnicianApplicationDetailsSection({
  tech,
  t,
  formatDate,
  formatCurrency,
}: Omit<TechnicianReviewSectionsProps, 'locale'>) {
  return (
    <AdminEntityCardInfoBox>
      <AdminEntityCardInfoRow label={t('technicians.detail.nationalId')}>
        {tech.national_id ?? t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.governorate')}>
        {tech.governorate ?? t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.area')}>
        {tech.area ?? t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.workingHours')}>
        {tech.working_hours ?? t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.startingPrice')}>
        {tech.starting_price != null
          ? formatCurrency(Number(tech.starting_price))
          : t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.yearsExperience')}>
        {tech.years_experience ?? t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.joined')}>
        {formatDate(tech.created_at)}
      </AdminEntityCardInfoRow>
    </AdminEntityCardInfoBox>
  );
}

export function TechnicianSkillsSection({
  tech,
  t,
  locale,
  formatCurrency,
}: TechnicianReviewSectionsProps) {
  const activeSkills = tech.skills.filter((s) => s.is_active !== false);

  if (activeSkills.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('technicians.detail.noSkills')}</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white">
      {activeSkills.map((skill, idx) => {
        const specialty = categoryName(skill, locale);
        const service = serviceName(skill, locale);
        const key = skill.service?.id ?? `skill-${idx}`;

        return (
          <li key={key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">{service}</p>
              {specialty ? (
                <p className="text-xs text-zinc-500">
                  {t('technicians.detail.specialty')}: {specialty}
                </p>
              ) : null}
            </div>
            {skill.price_override != null ? (
              <span className="shrink-0 rounded-full bg-[#FF6B00]/10 px-2.5 py-0.5 text-xs font-medium text-[#FF6B00]">
                {formatCurrency(Number(skill.price_override))}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function TechnicianPerformanceSection({
  tech,
  t,
}: Pick<TechnicianReviewSectionsProps, 'tech' | 't'>) {
  return (
    <AdminEntityCardInfoBox>
      <AdminEntityCardInfoRow label={t('technicians.detail.completedJobs')}>
        {tech.completed_jobs}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.rating')}>
        {tech.average_rating
          ? `${Number(tech.average_rating).toFixed(1)}★ (${tech.total_ratings})`
          : t('common.dash')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.available')}>
        {tech.is_available ? t('common.yes') : t('common.no')}
      </AdminEntityCardInfoRow>
      <AdminEntityCardInfoRow label={t('technicians.detail.maxDistance')}>
        {tech.max_distance_km ? `${tech.max_distance_km} km` : t('common.dash')}
      </AdminEntityCardInfoRow>
    </AdminEntityCardInfoBox>
  );
}

export function collectApplicationDocuments(
  tech: AdminTechnicianDetail,
  labels: { profilePhoto: string; idCard: string; verificationDoc: string },
): { url: string; label: string }[] {
  const docs: { url: string; label: string }[] = [];
  const seen = new Set<string>();

  const add = (url: string | null | undefined, label: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    docs.push({ url, label });
  };

  add(tech.profile_photo_url, labels.profilePhoto);
  add(tech.id_card_photo_url, labels.idCard);
  add(tech.avatar_url, labels.profilePhoto);

  tech.verification_docs?.forEach((url, i) => {
    add(url, `${labels.verificationDoc} ${i + 1}`);
  });

  return docs;
}
