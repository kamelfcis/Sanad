'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AdminPremiumTableHeaderCell, AdminPremiumTableCell } from '@/components/admin/admin-premium-table';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import type { HeaderSelectState } from '@/hooks/use-admin-table-selection';

export function AdminBulkDeleteToolbar({
  count,
  isPending,
  onDelete,
  onClear,
}: {
  count: number;
  isPending?: boolean;
  onDelete: () => void;
  onClear: () => void;
}) {
  const { t } = useAdminT();
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <p className="text-sm font-medium">{count}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isPending}>
          {t('common.delete')}
        </Button>
      </div>
    </div>
  );
}

export function AdminCardSelectToggle({
  id,
  checked,
  onChange,
  disabled,
  disabledReason,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onChange(value === true)}
      aria-label={disabledReason || id}
    />
  );
}

export function AdminSelectAllHeaderCell({
  state,
  onChange,
  disabled,
}: {
  state: HeaderSelectState;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <AdminPremiumTableHeaderCell className="w-10">
      <Checkbox
        checked={state}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
        aria-label="select-all"
      />
    </AdminPremiumTableHeaderCell>
  );
}

export function AdminSelectRowCell({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <AdminPremiumTableCell className="w-10">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
        aria-label={id}
      />
    </AdminPremiumTableCell>
  );
}
