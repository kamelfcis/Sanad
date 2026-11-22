import Link from 'next/link';
import { LandingHeroServer } from '@/components/landing/landing-hero-server';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { LandingTestimonialsSection } from '@/components/landing/landing-testimonials';
import { FAQSection } from '@/components/landing/faq';
import { ContactSection } from '@/components/landing/contact-section';
import { CTASection } from '@/components/landing/cta';

function LandingBrowseServicesStrip() {
  return (
    <section
      className="border-y border-border/50 bg-muted/30 px-4 py-7 md:px-6 lg:px-8"
      dir="rtl"
      aria-label="تصفح الخدمات"
    >
      <div className="mx-auto max-w-6xl text-center">
        <Link
          href="/services"
          className="text-sm font-semibold text-text-muted transition-colors hover:text-primary"
        >
          تصفّح الحِرف والخدمات
        </Link>
      </div>
    </section>
  );
}

export function LandingBookHome() {
  return (
    <>
      <LandingHeroServer />
      <HowItWorksSection />
      <LandingBrowseServicesStrip />
      <LandingTestimonialsSection />
      <FAQSection />
      <ContactSection />
      <CTASection />
    </>
  );
}
