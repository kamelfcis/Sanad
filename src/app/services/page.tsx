import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { FooterSection } from '@/components/landing/footer';
import { ServicesBrowseView } from '@/components/services/services-browse-view';
import { PageLoading } from '@/components/shared/page-loading';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'تصفّح الصنايعية',
  'دور على الخدمة اللي محتاجها واختار من بين أفضل الصنايعية الموثّقين في منطقتك على منصة سند.',
);

export default function ServicesBrowsePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background pt-20 md:pt-24">
        <Suspense fallback={<PageLoading className="container py-16" />}>
          <ServicesBrowseView />
        </Suspense>
      </main>
      <FooterSection />
    </>
  );
}
