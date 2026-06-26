import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanad.sa';

export const siteConfig = {
  name: 'سند',
  nameEn: 'Sanad',
  title: 'سند | Sanad — منصة الخدمات المنزلية',
  description:
    'احجز أفضل الفنيين والمتخصصين للخدمات المنزلية في المملكة العربية السعودية. كهرباء، سباكة، تكييف، نجارة والمزيد — بضمان الجودة ودعم على مدار الساعة.',
  keywords: [
    'خدمات منزلية',
    'صيانة منزلية',
    'فني كهرباء',
    'فني سباكة',
    'تكييف',
    'نجارة',
    'دهانات',
    'حجز فني',
    'سند',
    'Sanad',
    'home services Saudi Arabia',
    'خدمات منزلية السعودية',
    'فني معتمد',
    'صيانة منازل',
  ],
  url: siteUrl,
  locale: 'ar_SA',
  twitter: '@sanad_sa',
} as const;

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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
    languages: { 'ar-SA': siteUrl },
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
        alt: 'سند — منصة الخدمات المنزلية',
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
    'geo.region': 'SA',
    'geo.placename': 'Saudi Arabia',
    'content-language': 'ar',
  },
};

export function pageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? siteConfig.description,
    openGraph: { title, description: description ?? siteConfig.description },
    twitter: { title, description: description ?? siteConfig.description },
  };
}
