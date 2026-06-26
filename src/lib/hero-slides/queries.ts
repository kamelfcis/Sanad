import type { SupabaseClient } from '@supabase/supabase-js';
import type { HeroSlide } from '@/lib/hero-slides/types';

export async function fetchActiveHeroSlides(
  supabase: SupabaseClient,
): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as HeroSlide[];
}

export async function fetchAllHeroSlides(
  supabase: SupabaseClient,
): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as HeroSlide[];
}

export function mapHeroSlideToDisplay(slide: HeroSlide, index: number): {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  iconKey: string | null;
  rotate: number;
} {
  const rotatePattern = [-3, 2, -2, 3, -1];
  return {
    id: slide.id,
    src: slide.image_url,
    alt: slide.title_ar,
    title: slide.title_ar,
    subtitle: slide.subtitle_ar,
    iconKey: slide.icon_key,
    rotate: rotatePattern[index % rotatePattern.length],
  };
}
