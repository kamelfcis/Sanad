'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  useAdminDeleteBooking,
  useAdminDeleteUser,
  useAdminSetUserBlocked,
} from '@/hooks/use-admin';
import type { ModerationAction } from '@/components/admin/admin-moderation-dialog';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { useToast } from '@/hooks/use-toast';

export type ModerationSubject = 'technician' | 'customer' | 'booking';

export interface ModerationRequest {
  id: string;
  /** Shown in the dialog so the admin can see who/what they are acting on. */
  name: string;
  subject: ModerationSubject;
  action: ModerationAction;
}

/**
 * Drives the block / unblock / delete dialog for the admin technician,
 * customer and booking screens: dialog state, the mutation, the toast and the
 * translated labels. Pages only decide which action to request.
 */
export function useAdminModeration(options?: { onDeleted?: (request: ModerationRequest) => void }) {
  const { t } = useAdminT();
  const { toast } = useToast();
  const [request, setRequest] = useState<ModerationRequest | null>(null);

  const setBlocked = useAdminSetUserBlocked();
  const deleteUser = useAdminDeleteUser();
  const deleteBooking = useAdminDeleteBooking();

  const isPending = setBlocked.isPending || deleteUser.isPending || deleteBooking.isPending;

  const close = useCallback(() => setRequest(null), []);

  const onError = useCallback(
    (err: Error) => {
      toast({
        title: t('common.error'),
        description: translateAdminError(err.message, t),
        variant: 'destructive',
      });
    },
    [t, toast],
  );

  const confirm = useCallback(
    (reason?: string) => {
      if (!request) return;
      const { id, action, subject } = request;

      const onSuccess = (titleKey: string) => () => {
        toast({ title: t(titleKey) });
        if (action === 'delete') options?.onDeleted?.(request);
        setRequest(null);
      };

      if (action === 'delete' && subject === 'booking') {
        deleteBooking.mutate(
          { bookingId: id },
          { onSuccess: onSuccess('moderation.toast.bookingDeleted'), onError },
        );
        return;
      }

      if (action === 'delete') {
        deleteUser.mutate(
          { userId: id },
          { onSuccess: onSuccess('moderation.toast.userDeleted'), onError },
        );
        return;
      }

      setBlocked.mutate(
        { userId: id, blocked: action === 'block', reason },
        {
          onSuccess: onSuccess(
            action === 'block' ? 'moderation.toast.blocked' : 'moderation.toast.unblocked',
          ),
          onError,
        },
      );
    },
    [request, deleteBooking, deleteUser, setBlocked, onError, options, t, toast],
  );

  const dialogProps = useMemo(() => {
    const action = request?.action ?? null;
    const name = request?.name ?? '';
    const subject = request?.subject;
    const isDelete = action === 'delete';

    // `deleteTechnician` / `deleteCustomer` / `deleteBooking` spell out
    // different consequences, so the copy key depends on the subject.
    const deleteKey =
      subject === 'booking'
        ? 'deleteBooking'
        : subject === 'customer'
          ? 'deleteCustomer'
          : 'deleteTechnician';
    const copyKey = isDelete ? deleteKey : (action ?? 'block');

    return {
      open: request !== null,
      action,
      showReason: action === 'block',
      confirmPhrase: isDelete ? t('moderation.confirmPhrase') : undefined,
      isPending,
      labels: {
        title: action ? t(`moderation.dialog.${copyKey}.title`) : '',
        description: action ? t(`moderation.dialog.${copyKey}.description`, { name }) : '',
        consequences: isDelete ? t(`moderation.dialog.${copyKey}.consequences`) : undefined,
        reasonLabel: t('moderation.reasonLabel'),
        reasonPlaceholder: t('moderation.reasonPlaceholder'),
        confirmPhraseLabel: t('moderation.confirmPhraseLabel', {
          phrase: t('moderation.confirmPhrase'),
        }),
        confirm: action ? t(`moderation.dialog.${copyKey}.confirm`) : '',
        cancel: t('moderation.cancel'),
      },
      onConfirm: confirm,
      onCancel: close,
    };
  }, [request, isPending, confirm, close, t]);

  return { request: setRequest, dialogProps, isPending };
}
