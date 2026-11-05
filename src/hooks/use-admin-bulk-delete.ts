'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { useToast } from '@/hooks/use-toast';
import type { ModerationAction } from '@/components/admin/admin-moderation-dialog';

interface UseAdminBulkDeleteOptions {
  subject: string;
  deleteOne: (id: string) => Promise<unknown>;
  onSettled?: (result: { failed: string[] }) => void;
}

export function useAdminBulkDelete({ subject, deleteOne, onSettled }: UseAdminBulkDeleteOptions) {
  const { t } = useAdminT();
  const { toast } = useToast();
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [isPending, setIsPending] = useState(false);

  const close = useCallback(() => {
    if (!isPending) setPendingIds(null);
  }, [isPending]);

  const request = useCallback((ids: string[]) => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return;
    setPendingIds(unique);
  }, []);

  const confirm = useCallback(async () => {
    if (!pendingIds?.length) return;
    setIsPending(true);
    const failed: string[] = [];
    for (const id of pendingIds) {
      try {
        await deleteOne(id);
      } catch (err) {
        failed.push(id);
        toast({
          title: t('common.error'),
          description: translateAdminError(err instanceof Error ? err.message : String(err), t),
          variant: 'destructive',
        });
      }
    }
    setIsPending(false);
    setPendingIds(null);
    onSettled?.({ failed });
    if (failed.length === 0) {
      toast({ title: t('common.delete') });
    }
  }, [pendingIds, deleteOne, onSettled, t, toast]);

  const dialogProps = useMemo(() => {
    const count = pendingIds?.length ?? 0;
    const action: ModerationAction = 'delete';
    return {
      open: pendingIds !== null,
      action,
      confirmPhrase: t('moderation.confirmPhrase'),
      isPending,
      testId: 'admin-bulk-delete-dialog',
      labels: {
        title: t('common.delete'),
        description: `${subject} (${count})`,
        confirm: t('common.delete'),
        cancel: t('common.cancel'),
        confirmPhraseLabel: t('moderation.confirmPhraseLabel', {
          phrase: t('moderation.confirmPhrase'),
        }),
      },
      onConfirm: () => {
        void confirm();
      },
      onCancel: close,
    };
  }, [pendingIds, isPending, confirm, close, t, subject]);

  return { request, isPending, dialogProps };
}
