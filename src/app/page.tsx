import type { Metadata } from 'next';
import { defaultMetadata, pageMetadata } from '@/lib/seo';
import { Navbar } from '@/components/layout/navbar';
import { FooterSection } from '@/components/landing/footer';
import { LandingBookHome } from '@/components/landing/landing-book-home';

export const revalidate = 60;

export const metadata: Metadata = {
  ...defaultMetadata,
  ...pageMetadata('سند — خدمات منزلية في مصر', undefined, '/'),
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar overHero />
      <div id="main-content">
        <LandingBookHome />
        <FooterSection />
      </div>
    </main>
  );
}
