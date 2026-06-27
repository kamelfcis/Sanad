'use client';

import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import {
  AdminPremiumTable,
  AdminPremiumTableBody,
  AdminPremiumTableCell,
  AdminPremiumTableHead,
  AdminPremiumTableHeaderCell,
  AdminPremiumTableRow,
} from '@/components/admin/admin-premium-table';
import {
  AdminEmptyState,
  AdminEntityCard,
  AdminEntityCardHeader,
  AdminEntityCardInfoBox,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardTagPill,
  AdminFilterPills,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminAuditLogDetails, type MetadataValue } from '@/components/admin/admin-audit-log-details';
import { History, Calendar } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

const entityFilters = ['', 'booking', 'technician', 'customer', 'service', 'category', 'review'] as const;

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_id: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  admin?: { full_name?: string | null; email?: string | null } | null;
}

function useAuditLogLabels(t: ReturnType<typeof useAdminT>['t']) {
  const actionLabel = (action: string) => {
    const key = `auditLogs.actions.${action}`;
    const translated = t(key);
    return translated !== key ? translated : action.replace(/_/g, ' ');
  };

  const entityLabel = (type: string) => {
    const key = `auditLogs.filters.${type}` as 'auditLogs.filters.booking';
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  return { actionLabel, entityLabel };
}

function AuditLogCard({
  log,
  t,
  formatDateTime,
  actionLabel,
  entityLabel,
}: {
  log: AuditLogEntry;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
  actionLabel: (action: string) => string;
  entityLabel: (type: string) => string;
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardHeader
        title={actionLabel(log.action)}
        subtitle={
          <>
            <span className="font-semibold text-[#FF6B00]">
              {log.admin?.full_name ?? log.admin_id.slice(0, 8)}
            </span>{' '}
            <span>{t('auditLogs.performedOn')}</span>{' '}
            <span className="capitalize">{entityLabel(log.entity_type)}</span>
          </>
        }
        badge={
          <AdminEntityCardMetaPill variant="orange" className="capitalize">
            {entityLabel(log.entity_type)}
          </AdminEntityCardMetaPill>
        }
      />

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardTagPill>
          <code className="font-mono text-[11px]" dir="ltr">
            {log.entity_id.slice(0, 8)}…
          </code>
        </AdminEntityCardTagPill>
      </AdminEntityCardMeta>

      {log.metadata && Object.keys(log.metadata).length > 0 ? (
        <AdminEntityCardInfoBox className="mt-4" columns={1}>
          <AdminAuditLogDetails
            metadata={log.metadata as Record<string, MetadataValue>}
            entityType={log.entity_type}
            action={log.action}
          />
        </AdminEntityCardInfoBox>
      ) : null}

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          <time dateTime={log.created_at}>{formatDateTime(log.created_at)}</time>
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>
    </AdminEntityCard>
  );
}

export default function AdminAuditLogsPage() {
  const { t, formatDateTime } = useAdminT();
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminAuditLogs(entityType || undefined, undefined, page);
  const { actionLabel, entityLabel } = useAuditLogLabels(t);

  const filterLabel = (f: (typeof entityFilters)[number]) =>
    f === '' ? t('auditLogs.filters.all') : t(`auditLogs.filters.${f}` as 'auditLogs.filters.booking');

  return (
    <AdminListShell
      pageId="audit-logs"
      title={t('auditLogs.title')}
      subtitle={t('auditLogs.subtitle')}
      defaultView="table"
      cardsLayout="stack"
      skeletonCount={10}
      skeletonClassName="h-24 w-full rounded-2xl"
      filters={
        <AdminFilterPills
          filters={entityFilters.map((f) => ({ value: f, label: filterLabel(f) }))}
          value={entityType}
          onChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.logs.length}
      empty={<AdminEmptyState icon={History} title={t('auditLogs.empty')} />}
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
            summaryClassName="text-[#64748B]"
          />
        ) : null
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('auditLogs.admin')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('auditLogs.entity')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('auditLogs.entityId')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.date')}
            </AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {data?.logs.map((log: AuditLogEntry) => (
              <AdminPremiumTableRow key={log.id}>
                <AdminPremiumTableCell>
                  <Badge
                    variant="outline"
                    className="border-0 bg-[#FF6B00]/10 px-2.5 py-0.5 text-xs font-medium capitalize text-[#FF6B00]"
                  >
                    {actionLabel(log.action)}
                  </Badge>
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]">
                  {log.admin?.full_name ?? log.admin_id.slice(0, 8)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="capitalize text-[#64748B]">
                  {entityLabel(log.entity_type)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell dir="ltr">
                  <code className="rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-xs font-mono text-[#64748B]">
                    {log.entity_id.slice(0, 8)}…
                  </code>
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                  {formatDateTime(log.created_at)}
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        data?.logs.map((log: AuditLogEntry) => (
          <AuditLogCard
            key={log.id}
            log={log}
            t={t}
            formatDateTime={formatDateTime}
            actionLabel={actionLabel}
            entityLabel={entityLabel}
          />
        )) ?? null
      }
    />
  );
}
