'use client';

import { useState } from 'react';
import {
  useAdminDeleteUser,
  useAdminTechniciansList,
  useAdminUpdateTechnicianStatus,
  type AdminTechnicianListItem,
} from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  AdminEntityCardActions,
  AdminEntityCardActionsGroup,
  AdminEntityCardAvatar,
  AdminEntityCardHeader,
  AdminEntityCardInfoBox,
  AdminEntityCardInfoLtrValue,
  AdminEntityCardInfoRow,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardPrimaryAction,
  AdminSearchInput,
  AdminTableActionLink,
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminModerationDialog } from '@/components/admin/admin-moderation-dialog';
import {
  AdminBlockedBadge,
  AdminModerationActions,
} from '@/components/admin/admin-moderation-actions';
import {
  AdminBulkDeleteToolbar,
  AdminCardSelectToggle,
  AdminSelectAllHeaderCell,
  AdminSelectRowCell,
} from '@/components/admin/admin-bulk-select';
import {
  AdminStatusConfirmDialog,
  type TechnicianStatusAction,
} from '@/components/admin/admin-status-confirm-dialog';
import { AdminProviderContactActions } from '@/components/admin/admin-provider-contact-actions';
import { useAdminModeration, type ModerationRequest } from '@/hooks/use-admin-moderation';
import { useAdminTableSelection } from '@/hooks/use-admin-table-selection';
import { useAdminBulkDelete } from '@/hooks/use-admin-bulk-delete';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, Eye, Users, XCircle } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { isUserRowDeletable } from '@/lib/admin/moderation';
import { personDisplayName } from '@/lib/admin/person-name';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils/cn';
import {
  capacityTierLabel,
  contractorKindLabel,
  providerRoleLabel,
  specialtyArabicLabel,
  teamSizeLabel,
  type CapacityTier,
  type ContractorKind,
  type ProviderRole,
} from '@/lib/constants/technician-registration';

const statusColors: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 ring-1 ring-red-200/80 dark:bg-red-950 dark:text-red-400',
  suspended: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-400',
  unverified: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950 dark:text-sky-400',
};

function TechnicianStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('border-0 px-2.5 py-0.5 text-xs font-medium', statusColors[status] ?? '')}
    >
      {label}
    </Badge>
  );
}

function technicianInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function displayName(
  tech: AdminTechnicianListItem,
  t: ReturnType<typeof useAdminT>['t'],
): string {
  return personDisplayName(tech.full_name, t('technicians.unnamed'));
}

function contactLine(tech: AdminTechnicianListItem): string | null {
  const parts = [tech.phone, tech.email].filter((value): value is string => Boolean(value?.trim()));
  return parts.length ? parts.join(' · ') : null;
}

function tradeLabel(tech: AdminTechnicianListItem, dash: string): string {
  return (
    specialtyArabicLabel(tech.specialty_slug) ||
    specialtyArabicLabel(tech.specialty_label) ||
    tech.specialty_label?.trim() ||
    dash
  );
}

function roleLabel(tech: AdminTechnicianListItem): string {
  const role: ProviderRole = tech.provider_role === 'contractor' ? 'contractor' : 'technician';
  return providerRoleLabel(role);
}

function ContractorExtras({
  tech,
  t,
}: {
  tech: AdminTechnicianListItem;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  if (tech.provider_role !== 'contractor') return null;

  const extras: string[] = [];
  if (tech.contractor_kind) {
    extras.push(
      `${t('technicians.contractorKind')}: ${contractorKindLabel(tech.contractor_kind as ContractorKind)}`,
    );
  }
  if (tech.capacity_tier) {
    extras.push(
      `${t('technicians.capacity')}: ${capacityTierLabel(tech.capacity_tier as CapacityTier)}`,
    );
  }
  if (tech.team_size) {
    extras.push(`${t('technicians.teamSize')}: ${teamSizeLabel(tech.team_size)}`);
  }
  if (!extras.length) return null;

  return <p className="mt-0.5 text-xs text-[#64748B] dark:text-muted-foreground">{extras.join(' · ')}</p>;
}

function TechnicianIdentity({
  tech,
  t,
}: {
  tech: AdminTechnicianListItem;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  const name = displayName(tech, t);
  const contact = contactLine(tech);

  return (
    <div>
      <span className="flex flex-wrap items-center gap-1.5 font-medium text-[#0F172A] dark:text-foreground">
        <span data-testid={`admin-technician-name-${tech.id}`}>{name}</span>
        {tech.is_blocked ? <AdminBlockedBadge /> : null}
      </span>
      {contact ? (
        <AdminEntityCardInfoLtrValue className="mt-0.5 text-xs text-[#64748B] dark:text-muted-foreground">
          {contact}
        </AdminEntityCardInfoLtrValue>
      ) : null}
    </div>
  );
}

function TechnicianTradeCell({
  tech,
  t,
}: {
  tech: AdminTechnicianListItem;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <div>
      <p className="font-medium text-[#0F172A] dark:text-foreground">{tradeLabel(tech, t('common.dash'))}</p>
      <p className="text-xs text-[#64748B] dark:text-muted-foreground">{roleLabel(tech)}</p>
      <ContractorExtras tech={tech} t={t} />
    </div>
  );
}

function TechnicianContactActions({
  tech,
  name,
  variant,
}: {
  tech: AdminTechnicianListItem;
  name: string;
  variant: 'icons' | 'labeled';
}) {
  return (
    <AdminProviderContactActions
      technicianId={tech.id}
      name={name}
      phone={tech.phone}
      role={tech.provider_role}
      specialty={tech.specialty_slug}
      trade={tradeLabel(tech, '')}
      capacityTier={tech.capacity_tier}
      variant={variant}
    />
  );
}

function TechnicianStatusActions({
  tech,
  disabled,
  onRequest,
  t,
}: {
  tech: AdminTechnicianListItem;
  disabled: boolean;
  onRequest: (action: TechnicianStatusAction) => void;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  const canApprove = tech.verification_status !== 'verified';
  const canReject = tech.verification_status !== 'rejected';

  return (
    <>
      {canApprove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn('min-h-[44px] gap-1.5', adminActionButtonClass)}
          data-testid={`admin-approve-${tech.id}`}
          onClick={() => onRequest('approve')}
        >
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
          {t('technicians.detail.approve')}
        </Button>
      ) : null}
      {canReject ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn('min-h-[44px] gap-1.5', adminActionButtonDestructiveClass)}
          data-testid={`admin-reject-${tech.id}`}
          onClick={() => onRequest('reject')}
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
          {t('technicians.detail.reject')}
        </Button>
      ) : null}
    </>
  );
}

function TechnicianCard({
  tech,
  t,
  formatDate,
  statusLabel,
  onModerate,
  onStatus,
  isPending,
  isSelected,
  onSelect,
  selectable,
  notSelectableReason,
}: {
  tech: AdminTechnicianListItem;
  t: ReturnType<typeof useAdminT>['t'];
  formatDate: ReturnType<typeof useAdminT>['formatDate'];
  statusLabel: (status: string) => string;
  onModerate: (request: ModerationRequest) => void;
  onStatus: (action: TechnicianStatusAction) => void;
  isPending: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  selectable: boolean;
  notSelectableReason: string;
}) {
  const name = displayName(tech, t);
  const contact = contactLine(tech);

  return (
    <AdminEntityCard>
      <AdminCardSelectToggle
        id={tech.id}
        checked={isSelected}
        onChange={onSelect}
        disabled={!selectable}
        disabledReason={notSelectableReason}
      />

      <AdminEntityCardHeader
        title={
          <span data-testid={`admin-technician-name-${tech.id}`}>{name}</span>
        }
        subtitle={
          contact ? (
            <AdminEntityCardInfoLtrValue>{contact}</AdminEntityCardInfoLtrValue>
          ) : null
        }
        avatar={
          <AdminEntityCardAvatar
            src={tech.avatar_url}
            alt={name}
            fallback={technicianInitials(name)}
          />
        }
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            {tech.is_blocked ? <AdminBlockedBadge /> : null}
            <TechnicianStatusBadge
              status={tech.verification_status}
              label={statusLabel(tech.verification_status)}
            />
          </div>
        }
      />

      <AdminEntityCardInfoBox className="mt-4">
        <AdminEntityCardInfoRow label={t('technicians.trade')} fullWidth>
          {tradeLabel(tech, t('common.dash'))}
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('technicians.role')} fullWidth>
          <span>
            {roleLabel(tech)}
            <ContractorExtras tech={tech} t={t} />
          </span>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.jobs')}>
          <span className="font-semibold tabular-nums">{tech.completed_jobs ?? 0}</span>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.rating')}>
          <span className="text-[#64748B] dark:text-muted-foreground">
            {tech.average_rating
              ? `${Number(tech.average_rating).toFixed(1)}★`
              : t('common.dash')}
          </span>
        </AdminEntityCardInfoRow>
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {tech.created_at ? formatDate(tech.created_at) : t('common.dash')}
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          <TechnicianContactActions tech={tech} name={name} variant="labeled" />
          <TechnicianStatusActions
            tech={tech}
            disabled={isPending}
            onRequest={onStatus}
            t={t}
          />
          <AdminModerationActions
            id={tech.id}
            name={name}
            subject="technician"
            isBlocked={tech.is_blocked}
            disabled={isPending}
            onRequest={onModerate}
          />
        </AdminEntityCardActionsGroup>
        <AdminEntityCardPrimaryAction href={`/admin/technicians/${tech.id}`} icon={Eye}>
          {t('common.view')}
        </AdminEntityCardPrimaryAction>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminTechniciansPage() {
  const { t, formatDate } = useAdminT();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminTechniciansList(search, page);
  const { request: moderate, dialogProps, isPending } = useAdminModeration();
  const updateStatus = useAdminUpdateTechnicianStatus();
  const actingAdminId = useAuthStore((s) => s.profile?.id ?? null);
  const [statusTarget, setStatusTarget] = useState<{
    id: string;
    name: string;
    action: TechnicianStatusAction;
  } | null>(null);

  const rows = data?.technicians ?? [];
  const selection = useAdminTableSelection(
    rows.map((tech) => ({ id: tech.id, selectable: isUserRowDeletable(tech, actingAdminId) })),
    `${search}|${page}`,
  );
  const deleteUser = useAdminDeleteUser();
  const bulkDelete = useAdminBulkDelete({
    subject: 'technicians',
    requireConfirmPhrase: true,
    deleteOne: (id) => deleteUser.mutateAsync({ userId: id }),
    onSettled: ({ failed }) => selection.replace(failed),
  });

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const pendingAction = statusTarget?.action ?? null;
  const statusConfirmLabels = pendingAction
    ? {
        title: t(`technicians.detail.confirm.${pendingAction}.title`),
        description: t(`technicians.detail.confirm.${pendingAction}.description`, {
          name: statusTarget?.name ?? t('technicians.unnamed'),
        }),
        reasonLabel: t('technicians.detail.confirm.reasonLabel'),
        reasonPlaceholder: t('technicians.detail.confirm.reasonPlaceholder'),
        confirm: t(`technicians.detail.confirm.${pendingAction}.confirm`),
        cancel: t('technicians.detail.confirm.cancel'),
      }
    : {
        title: '',
        description: '',
        reasonLabel: '',
        reasonPlaceholder: '',
        confirm: '',
        cancel: t('technicians.detail.confirm.cancel'),
      };

  const handleStatusConfirm = (reason?: string) => {
    if (!statusTarget) return;
    updateStatus.mutate(
      { technicianId: statusTarget.id, action: statusTarget.action, reason },
      {
        onSuccess: () => {
          toast({ title: t(`technicians.detail.confirm.${statusTarget.action}.success`) });
          setStatusTarget(null);
        },
        onError: (err) => {
          toast({
            title: t('common.error'),
            description: translateAdminError(err.message, t),
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <>
    <AdminListShell
      pageId="technicians"
      title={t('technicians.title')}
      subtitle={t('technicians.subtitle')}
      defaultView="table"
      search={
        <AdminSearchInput
          placeholder={t('technicians.searchPlaceholder')}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.technicians.length}
      empty={
        <AdminEmptyState
          icon={Users}
          title={t('technicians.empty.title')}
          subtitle={t('technicians.empty.subtitle')}
        />
      }
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
          />
        ) : null
      }
      bulkToolbar={
        <AdminBulkDeleteToolbar
          count={selection.count}
          isPending={bulkDelete.isPending}
          onDelete={() => bulkDelete.request(selection.selected)}
          onClear={selection.clear}
        />
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminSelectAllHeaderCell
              state={selection.headerState}
              onChange={selection.selectAll}
              disabled={!selection.hasSelectableRows || bulkDelete.isPending}
            />
            <AdminPremiumTableHeaderCell>{t('tables.name')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('technicians.trade')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.status')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.jobs')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.rating')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.joined')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {rows.map((tech) => {
              const name = displayName(tech, t);
              return (
              <AdminPremiumTableRow key={tech.id}>
                <AdminSelectRowCell
                  id={tech.id}
                  checked={selection.isSelected(tech.id)}
                  onChange={(checked) => selection.toggle(tech.id, checked)}
                  disabled={bulkDelete.isPending || !isUserRowDeletable(tech, actingAdminId)}
                  disabledReason={t('moderation.bulk.protectedRow')}
                />
                <AdminPremiumTableCell>
                  <TechnicianIdentity tech={tech} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <TechnicianTradeCell tech={tech} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <TechnicianStatusBadge
                    status={tech.verification_status}
                    label={statusLabel(tech.verification_status)}
                  />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium tabular-nums text-[#0F172A] dark:text-foreground">
                  {tech.completed_jobs ?? 0}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] dark:text-muted-foreground md:table-cell">
                  {tech.average_rating
                    ? `${Number(tech.average_rating).toFixed(1)}★`
                    : t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] dark:text-muted-foreground md:table-cell">
                  {tech.created_at ? formatDate(tech.created_at) : t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <AdminTableActionLink href={`/admin/technicians/${tech.id}`}>
                      {t('common.view')}
                    </AdminTableActionLink>
                    <TechnicianContactActions tech={tech} name={name} variant="icons" />
                    <TechnicianStatusActions
                      tech={tech}
                      disabled={isPending || updateStatus.isPending}
                      onRequest={(action) => setStatusTarget({ id: tech.id, name, action })}
                      t={t}
                    />
                    <AdminModerationActions
                      id={tech.id}
                      name={name}
                      subject="technician"
                      isBlocked={tech.is_blocked}
                      disabled={isPending}
                      onRequest={moderate}
                    />
                  </div>
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
              );
            })}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        rows.map((tech) => (
          <TechnicianCard
            key={tech.id}
            tech={tech}
            t={t}
            formatDate={formatDate}
            statusLabel={statusLabel}
            onModerate={moderate}
            onStatus={(action) =>
              setStatusTarget({ id: tech.id, name: displayName(tech, t), action })
            }
            isPending={isPending || updateStatus.isPending}
            isSelected={selection.isSelected(tech.id)}
            onSelect={(checked) => selection.toggle(tech.id, checked)}
            selectable={!bulkDelete.isPending && isUserRowDeletable(tech, actingAdminId)}
            notSelectableReason={t('moderation.bulk.protectedRow')}
          />
        ))
      }
    />
    <AdminModerationDialog {...dialogProps} />
    <AdminModerationDialog {...bulkDelete.dialogProps} />
    <AdminStatusConfirmDialog
      open={statusTarget !== null}
      action={pendingAction}
      technicianName={statusTarget?.name ?? ''}
      requiresReason={pendingAction === 'reject'}
      isPending={updateStatus.isPending}
      labels={statusConfirmLabels}
      onConfirm={handleStatusConfirm}
      onCancel={() => {
        if (!updateStatus.isPending) setStatusTarget(null);
      }}
    />
    </>
  );
}
