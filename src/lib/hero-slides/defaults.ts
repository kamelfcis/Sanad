import type { HeroSlideDisplay } from '@/lib/hero-slides/types';

export const DEFAULT_HERO_SLIDES: HeroSlideDisplay[] = [
  {
    id: 'default-electrical',
    src: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80',
    alt: 'فني كهرباء',
    title: 'كهرباء',
    subtitle: 'خدمة احترافية',
    iconKey: 'zap',
    rotate: -3,
  },
  {
    id: 'default-plumbing',
    src: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80',
    alt: 'فني سباكة',
    title: 'سباكة',
    subtitle: 'خدمة احترافية',
    iconKey: 'droplet',
    rotate: 2,
  },
  {
    id: 'default-ac',
    src: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
    alt: 'فني تكييف',
    title: 'تكييف وتبريد',
    subtitle: 'خدمة احترافية',
    iconKey: 'snowflake',
    rotate: -2,
  },
];
