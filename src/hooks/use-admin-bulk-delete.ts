'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { useToast } from '@/hooks/use-toast';

/** One key per admin list page, matching `moderation.bulk.dialog.*` in admin.json. */
export type AdminBulkSubject =
  | 'bookings'
  | 'customers'
  | 'technicians'
  | 'categories'
  | 'services'
  | 'heroSlides';

export interface AdminBulkDeleteOutcome {
  deleted: string[];
  failed: string[];
}

interface UseAdminBulkDeleteOptions {
  subject: AdminBulkSubject;
  /** The page's existing single-id DELETE call — there is no bulk endpoint. */
  deleteOne: (id: string) => Promise<unknown>;
  /**
   * Users and bookings make the admin type the delete phrase for a single row,
   * so a batch of them asks for it once too.
   */
  requireConfirmPhrase?: boolean;
  onSettled?: (outcome: AdminBulkDeleteOutcome) => void;
}

/**
 * Confirm-then-delete for a batch of ids. Deletes run one at a time against the
 * existing per-id endpoints so each one still writes its own audit entry, and a
 * failure part-way through never hides the rows that did survive.
 */
export function useAdminBulkDelete({
  subject,
  deleteOne,
  requireConfirmPhrase = false,
  onSettled,
}: UseAdminBulkDeleteOptions) {
  const { t } = useAdminT();
  const { toast } = useToast();
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const request = useCallback((ids: string[]) => {
    if (ids.length > 0) setPendingIds(ids);
  }, []);

  const close = useCallback(() => {
    if (isPending) return;
    setPendingIds([]);
  }, [isPending]);

  const confirm = useCallback(async () => {
    if (pendingIds.length === 0 || isPending) return;
    setIsPending(true);

    const deleted: string[] = [];
    const failed: string[] = [];
    let firstError: string | undefined;

    for (const id of pendingIds) {
      try {
        await deleteOne(id);
        deleted.push(id);
      } catch (err) {
        failed.push(id);
        firstError ??= err instanceof Error ? err.message : String(err);
      }
    }

    setIsPending(false);
    setPendingIds([]);

    if (failed.length === 0) {
      toast({ title: t('moderation.bulk.toast.allDeleted', { count: deleted.length }) });
    } else if (deleted.length === 0) {
      toast({
        title: t('moderation.bulk.toast.allFailed', { failed: failed.length }),
        description: translateAdminError(firstError, t),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('moderation.bulk.toast.partial', {
          deleted: deleted.length,
          failed: failed.length,
        }),
        description: translateAdminError(firstError, t),
        variant: 'destructive',
      });
    }

    onSettled?.({ deleted, failed });
  }, [pendingIds, isPending, deleteOne, onSettled, t, toast]);

  const dialogProps = useMemo(() => {
    const count = pendingIds.length;
    const copy = `moderation.bulk.dialog.${subject}`;

    return {
      open: count > 0,
      action: 'delete' as const,
      testId: 'admin-bulk-delete-dialog',
      confirmPhrase: requireConfirmPhrase ? t('moderation.confirmPhrase') : undefined,
      isPending,
      labels: {
        title: t(`${copy}.title`, { count }),
        description: t(`${copy}.description`, { count }),
        consequences: t(`${copy}.consequences`),
        confirmPhraseLabel: t('moderation.confirmPhraseLabel', {
          phrase: t('moderation.confirmPhrase'),
        }),
        confirm: t(`${copy}.confirm`, { count }),
        cancel: t('moderation.cancel'),
      },
      onConfirm: () => {
        void confirm();
      },
      onCancel: close,
    };
  }, [pendingIds, subject, requireConfirmPhrase, isPending, confirm, close, t]);

  return { request, dialogProps, isPending };
}
