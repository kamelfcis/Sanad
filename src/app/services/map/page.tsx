import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { FooterSection } from '@/components/landing/footer';
import { ServicesMapView } from '@/components/services/services-map-view';
import { PageLoading } from '@/components/shared/page-loading';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'خريطة الصنايعية',
  'شوف أقرب الصنايعية الموثّقين على الخريطة واختار من يناسبك على منصة سند.',
);

export const dynamic = 'force-dynamic';

export default function ServicesMapPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background pt-20 md:pt-24">
        <Suspense fallback={<PageLoading className="container py-16" />}>
          <ServicesMapView />
        </Suspense>
      </main>
      <FooterSection />
    </>
  );
}
