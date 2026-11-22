import { getSiteUrl, siteConfig } from '@/lib/seo';

export function JsonLd() {
  const siteUrl = getSiteUrl();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'سند',
    alternateName: 'Sanad',
    url: siteUrl,
    description:
      'منصة الخدمات المنزلية في مصر — احجز صنايعي موثّقين للكهرباء والسباكة والنجارة والمزيد.',
    inLanguage: 'ar-EG',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/services?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'سند',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icons/icon-512.png`,
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'Egypt',
    },
    serviceType: ['Home Services', 'Maintenance', 'Repair'],
  };

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'سند — Sanad',
    description: 'منصة حجز الخدمات المنزلية في مصر',
    url: siteUrl,
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '10000',
      bestRating: '5',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
    </>
  );
}
