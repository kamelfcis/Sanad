import type { Metadata } from 'next';

const defaultSiteUrl = 'https://sanad-five-zeta.vercel.app';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl;
  return raw.replace(/\/$/, '');
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_NOINDEX === 'true';
}

const siteUrl = getSiteUrl();

export const siteConfig = {
  name: 'سند',
  nameEn: 'Sanad',
  title: 'سند | Sanad — منصة الخدمات المنزلية في مصر',
  description:
    'احجز أفضل الصنايعي والمتخصصين للخدمات المنزلية في مصر. كهرباء، سباكة، نجارة، دهانات والمزيد — بضمان الجودة ودفع إنستاباي أو فودافون كاش.',
  keywords: [
    'خدمات منزلية',
    'صيانة منزلية',
    'صنايعي',
    'فني كهرباء',
    'فني سباكة',
    'نجارة',
    'دهانات',
    'حجز فني',
    'سند',
    'Sanad',
    'خدمات منزلية مصر',
    'فني معتمد',
    'صيانة منازل',
    'القاهرة',
    'إنستاباي',
    'فودافون كاش',
  ],
  url: siteUrl,
  locale: 'ar_EG',
  twitter: '@sanad_eg',
} as const;

function robotsForEnvironment(): Metadata['robots'] {
  if (isPreviewDeployment()) {
    return { index: false, follow: false, googleBot: { index: false, follow: false } };
  }
  return {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  };
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.nameEn, url: siteUrl }],
  creator: siteConfig.nameEn,
  publisher: siteConfig.nameEn,
  robots: robotsForEnvironment(),
  alternates: {
    canonical: '/',
    languages: { 'ar-EG': siteUrl },
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteUrl,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'سند — منصة الخدمات المنزلية في مصر',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitter,
    creator: siteConfig.twitter,
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/og-image.svg'],
  },
  category: 'technology',
  other: {
    'geo.region': 'EG',
    'geo.placename': 'Egypt',
    'content-language': 'ar',
  },
};

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}

export function pageMetadata(
  title: string,
  description?: string,
  canonicalPath?: string,
): Metadata {
  const path = canonicalPath ?? '/';
  return {
    title,
    description: description ?? siteConfig.description,
    alternates: { canonical: path },
    robots: robotsForEnvironment(),
    openGraph: {
      title,
      description: description ?? siteConfig.description,
      url: absoluteUrl(path),
    },
    twitter: { title, description: description ?? siteConfig.description },
  };
}
