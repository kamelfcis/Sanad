import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/auth/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/auth/register-technician`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  return staticRoutes;
}
