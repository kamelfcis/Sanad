import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FF6B00',
    orientation: 'portrait-primary',
    lang: 'ar',
    dir: 'rtl',
    categories: ['business', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  };
}
