'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, source: 'app/global-error' });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>حدث خطأ خطير</h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          نعتذر، حدث خطأ غير متوقع. يرجى تحديث الصفحة.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#FF6B00',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
