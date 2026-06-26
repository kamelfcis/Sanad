'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { AdminI18nProvider, useAdminT } from '@/lib/i18n/admin/use-admin-t';

function UnauthorizedContent() {
  const { t } = useAdminT();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('unauthorized.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('unauthorized.description')}</p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">{t('unauthorized.backHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <AdminI18nProvider>
      <UnauthorizedContent />
    </AdminI18nProvider>
  );
}
