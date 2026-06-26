import type { Metadata, Viewport } from 'next';
import { Tajawal, Cairo } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/utils/providers';
import { AuthInitializer } from '@/components/shared/auth-initializer';
import { SessionAuthListener } from '@/components/shared/session-auth-listener';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import GlobalErrorHandler from '@/components/shared/global-error-handler';
import { JsonLd } from '@/components/shared/json-ld';
import { defaultMetadata } from '@/lib/seo';
import { colors } from '@/lib/design-system';

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic'],
  display: 'swap',
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-512.svg',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'سند',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: colors.primary },
    { media: '(prefers-color-scheme: dark)', color: '#0B1720' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
        <link rel="apple-touch-icon" href="/icons/icon-512.svg" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          تخطي إلى المحتوى
        </a>
        <Providers>
          <ErrorBoundary>
            <AuthInitializer>
              <SessionAuthListener />
              <GlobalErrorHandler />
              {children}
              <Toaster />
            </AuthInitializer>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
