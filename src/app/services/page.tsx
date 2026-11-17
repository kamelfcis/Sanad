import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { FooterSection } from '@/components/landing/footer';
import { ServicesBrowseView } from '@/components/services/services-browse-view';
import { PageLoading } from '@/components/shared/page-loading';
import { pageMetadata } from '@/lib/seo';
import { isServiceRoleConfigured } from '@/lib/supabase/admin';
import { listBrowseTechnicians } from '@/lib/technicians/browse-query';
import type { BrowseTechniciansResponse } from '@/types/technician-browse';

export const revalidate = 60;

export const metadata: Metadata = pageMetadata(
  'تصفّح الصنايعية',
  'دور على الخدمة اللي محتاجها واختار من بين أفضل الصنايعية الموثّقين في منطقتك على منصة سند.',
  '/services',
);

async function loadInitialBrowse(): Promise<BrowseTechniciansResponse | undefined> {
  if (!isServiceRoleConfigured()) return undefined;
  try {
    return await listBrowseTechnicians({
      page: 1,
      limit: 24,
      sort: 'rating',
      maxPrice: 500,
      availableOnly: false,
    });
  } catch {
    return undefined;
  }
}

export default async function ServicesBrowsePage() {
  const initialBrowse = await loadInitialBrowse();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background pt-20 md:pt-24">
        <Suspense fallback={<PageLoading className="container py-16" />}>
          <ServicesBrowseView initialBrowse={initialBrowse} />
        </Suspense>
      </main>
      <FooterSection />
    </>
  );
}
