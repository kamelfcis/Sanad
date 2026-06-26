'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/logger';

export default function GlobalErrorHandler() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError(event.error ?? new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      reportError(error, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
