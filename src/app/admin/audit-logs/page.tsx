'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const entityFilters = ['', 'booking', 'technician', 'customer', 'service', 'category', 'review'] as const;

export default function AdminAuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminAuditLogs(entityType || undefined, undefined, page);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">Track all admin actions on the platform.</p>
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
            {f || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">Failed to load audit logs.</div>
      ) : !data?.logs.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <History className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No audit logs</h2>
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
                      <span className="font-medium">{log.admin?.full_name ?? log.admin_id.slice(0, 8)}</span>
                      <span className="text-muted-foreground"> performed </span>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> on {log.entity_type} </span>
                      <code className="rounded bg-muted px-1 text-xs">{log.entity_id?.slice(0, 8)}...</code>
                    </p>
                    {log.metadata && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">Details</summary>
                        <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {data.page} of {Math.ceil(data.total / data.limit)} ({data.total} total)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
