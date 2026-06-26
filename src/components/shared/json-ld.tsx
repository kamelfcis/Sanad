export function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'سند',
    alternateName: 'Sanad',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanad.sa',
    description:
      'منصة الخدمات المنزلية في المملكة العربية السعودية — احجز فنيين معتمدين للكهرباء والسباكة والتكييف والمزيد.',
    inLanguage: 'ar-SA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanad.sa'}/services?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'سند',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanad.sa'}/icons/icon-512.svg`,
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'Saudi Arabia',
    },
    serviceType: ['Home Services', 'Maintenance', 'Repair'],
  };

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'سند — Sanad',
    description: 'منصة حجز الخدمات المنزلية',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanad.sa',
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
