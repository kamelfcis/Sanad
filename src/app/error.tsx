'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, source: 'app/error' });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">حدث خطأ</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          نعتذر، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="ml-2 h-4 w-4" />
          إعادة المحاولة
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="ml-2 h-4 w-4" />
            الصفحة الرئيسية
          </Link>
        </Button>
      </div>
    </div>
  );
}
