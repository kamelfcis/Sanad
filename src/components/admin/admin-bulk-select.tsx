'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AdminPremiumTableCell,
  AdminPremiumTableHeaderCell,
} from '@/components/admin/admin-premium-table';
import type { AdminSelectAllState } from '@/hooks/use-admin-table-selection';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

/**
 * A 20px box with an invisible 12px halo, so the pointer/touch target is the
 * same 44px the admin action buttons already use.
 */
const hitAreaClass = "relative before:absolute before:-inset-3 before:content-['']";

const rowCheckboxClass = cn(
  hitAreaClass,
  'h-5 w-5 rounded-[5px] border-[#CBD5E1] dark:border-border shadow-none',
  'focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40',
  'data-[state=checked]:border-[#FF6B00] data-[state=checked]:bg-[#FF6B00] data-[state=checked]:text-white',
  'data-[state=indeterminate]:border-[#FF6B00] data-[state=indeterminate]:bg-[#FF6B00] data-[state=indeterminate]:text-white',
);

const headerCheckboxClass = cn(
  hitAreaClass,
  'h-5 w-5 rounded-[5px] border-white/80 bg-white/15 shadow-none',
  'focus-visible:ring-2 focus-visible:ring-white/70',
  'data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-[#FF6B00]',
  'data-[state=indeterminate]:border-white data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#FF6B00]',
);

/** Header cell holding the "select every row on this page" checkbox. */
export function AdminSelectAllHeaderCell({
  state,
  onChange,
  disabled,
}: {
  state: AdminSelectAllState;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useAdminT();
  const label = t('moderation.bulk.selectAll');

  return (
    <AdminPremiumTableHeaderCell className="w-12 px-3">
      <span className="flex items-center justify-center">
        <Checkbox
          checked={state}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked === true)}
          aria-label={label}
          title={label}
          data-testid="admin-select-all"
          className={headerCheckboxClass}
        />
      </span>
    </AdminPremiumTableHeaderCell>
  );
}

/** First body cell of a selectable row. */
export function AdminSelectRowCell({
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
  const { t } = useAdminT();
  const label = t('moderation.bulk.selectRow');

  return (
    <AdminPremiumTableCell className="w-12 px-3">
      <span className="flex items-center justify-center">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => onChange(next === true)}
          aria-label={label}
          title={disabled ? disabledReason : label}
          data-testid={`admin-select-${id}`}
          className={rowCheckboxClass}
        />
      </span>
    </AdminPremiumTableCell>
  );
}

/**
 * Card-view equivalent of the row checkbox. Cards have no header row to hang a
 * checkbox column off, so selection is an explicit labelled control instead.
 */
export function AdminCardSelectToggle({
  id,
  checked,
  onChange,
  disabled,
  disabledReason,
  className,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  const { t } = useAdminT();
  const inputId = `admin-card-select-${id}`;

  return (
    <label
      htmlFor={inputId}
      title={disabled ? disabledReason : undefined}
      className={cn(
        'dark:border-border dark:bg-card dark:text-muted-foreground mb-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 self-start rounded-full border border-[#E2E8F0] bg-white px-3.5 text-xs font-medium text-[#64748B] transition-colors select-none hover:border-[#FF6B00]/40 hover:text-[#FF6B00]',
        checked && 'border-[#FF6B00]/50 bg-[#FF6B00]/5 text-[#FF6B00]',
        disabled && 'cursor-not-allowed opacity-50 hover:border-[#E2E8F0] hover:text-[#64748B]',
        className,
      )}
    >
      <Checkbox
        id={inputId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onChange(next === true)}
        data-testid={`admin-card-select-${id}`}
        className={cn(rowCheckboxClass, 'h-4 w-4 before:-inset-2')}
      />
      {checked ? t('moderation.bulk.selectedOne') : t('moderation.bulk.select')}
    </label>
  );
}

/** Appears above the list as soon as one row is selected. */
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
    <div
      role="region"
      aria-label={t('moderation.bulk.toolbarLabel')}
      data-testid="admin-bulk-toolbar"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#FF6B00]/30 bg-[#FF6B00]/[0.06] px-4 py-2.5 shadow-sm"
    >
      <span
        data-testid="admin-bulk-count"
        className="dark:text-foreground text-sm font-semibold text-[#0F172A]"
      >
        {t('moderation.bulk.selected', { count })}
      </span>

      <div className="ms-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={onClear}
          data-testid="admin-bulk-clear"
          className="dark:text-muted-foreground min-h-[44px] text-[#64748B] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
        >
          {t('moderation.bulk.clearSelection')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={onDelete}
          data-testid="admin-bulk-delete"
          className="min-h-[44px] gap-1.5 bg-red-600 text-white hover:bg-red-700"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {t('moderation.bulk.deleteSelected')}
        </Button>
      </div>
    </div>
  );
}
