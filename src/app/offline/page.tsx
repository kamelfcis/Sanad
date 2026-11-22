import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'غير متصل',
  'أنت غير متصل بالإنترنت. تحقق من الشبكة وحاول مرة أخرى.',
  '/offline',
);

export default function OfflinePage() {
  return (
    <main id="main-content" className="container flex min-h-screen flex-col items-center justify-center py-16 text-center" dir="rtl">
      <h1 className="text-2xl font-bold text-text-primary">أنت غير متصل بالإنترنت</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        تحقق من اتصالك بالشبكة ثم أعد فتح الصفحة. You are offline — check your connection and try again.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </main>
  );
}
