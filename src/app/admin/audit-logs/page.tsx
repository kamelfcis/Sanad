'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { History } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

const entityFilters = ['', 'booking', 'technician', 'customer', 'service', 'category', 'review'] as const;

export default function AdminAuditLogsPage() {
  const { t, formatDateTime } = useAdminT();
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminAuditLogs(entityType || undefined, undefined, page);

  const filterLabel = (f: typeof entityFilters[number]) =>
    f === '' ? t('auditLogs.filters.all') : t(`auditLogs.filters.${f}` as 'auditLogs.filters.booking');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('auditLogs.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('auditLogs.subtitle')}</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {entityFilters.map((f) => (
          <button
            key={f}
            onClick={() => { setEntityType(f); setPage(1); }}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              entityType === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !data?.logs.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <History className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('auditLogs.empty')}</h2>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.logs.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Badge variant="outline" className="shrink-0 capitalize">{log.action?.replace(/_/g, ' ')}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {t('auditLogs.performed', {
                        admin: log.admin?.full_name ?? log.admin_id.slice(0, 8),
                        action: log.action,
                        entityType: log.entity_type,
                      })}
                      {' '}
                      <code className="rounded bg-muted px-1 text-xs">{log.entity_id?.slice(0, 8)}...</code>
                    </p>
                    {log.metadata && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">{t('auditLogs.details')}</summary>
                        <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
            summaryClassName="text-muted-foreground"
          />
        </>
      )}
    </div>
  );
}
