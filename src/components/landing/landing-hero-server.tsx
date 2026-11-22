import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { fetchActiveHeroSlides } from '@/lib/hero-slides/queries';
import { LandingHero } from '@/components/landing/landing-hero';

export async function LandingHeroServer() {
  let initialSlides: Awaited<ReturnType<typeof fetchActiveHeroSlides>> = [];

  if (isServiceRoleConfigured()) {
    try {
      const supabase = createServiceRoleClient();
      initialSlides = await fetchActiveHeroSlides(supabase);
    } catch {
      initialSlides = [];
    }
  }

  return <LandingHero initialSlides={initialSlides} />;
}
