import { Navbar } from '@/components/layout/navbar';
import { HeroSection } from '@/components/landing/hero';
import { ServicesSection } from '@/components/landing/services';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { TrustSection } from '@/components/landing/trust';
import { TestimonialsSection } from '@/components/landing/testimonials';
import { FAQSection } from '@/components/landing/faq';
import { CTASection } from '@/components/landing/cta';
import { FooterSection } from '@/components/landing/footer';
import { LandingPageClient } from '@/components/landing/landing-page-client';

export default function LandingPage() {
  return (
    <LandingPageClient>
      <Navbar />
      <div id="main-content">
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <TrustSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
      </div>
    </LandingPageClient>
  );
}
