'use client';

import { useQuery } from '@tanstack/react-query';
import type { HeroSlide } from '@/lib/hero-slides/types';
import { DEFAULT_HERO_SLIDES } from '@/lib/hero-slides/defaults';
import { mapHeroSlideToDisplay } from '@/lib/hero-slides/queries';

async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const res = await fetch('/api/hero-slides');
  if (!res.ok) throw new Error('Failed to fetch hero slides');
  return res.json();
}

export function useHeroSlides() {
  const query = useQuery({
    queryKey: ['hero-slides'],
    queryFn: fetchHeroSlides,
    staleTime: 5 * 60 * 1000,
  });

  const slides =
    query.data && query.data.length > 0
      ? query.data.map(mapHeroSlideToDisplay)
      : DEFAULT_HERO_SLIDES;

  return {
    ...query,
    slides,
    isUsingDefaults: !query.data?.length,
  };
}
