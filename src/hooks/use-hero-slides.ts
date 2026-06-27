'use client';

import { useQuery } from '@tanstack/react-query';
import type { HeroSlide, HeroSlideDisplay } from '@/lib/hero-slides/types';
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

  const slides: HeroSlideDisplay[] =
    query.data?.map((slide, index) => mapHeroSlideToDisplay(slide, index)) ?? [];

  return {
    ...query,
    slides,
  };
}
