'use client';

import { Ban, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  adminActionButtonClass,
  adminActionButtonDestructiveClass,
} from '@/components/admin/admin-list-chrome';
import type { ModerationRequest, ModerationSubject } from '@/hooks/use-admin-moderation';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

/** Orange "محظور" pill shown next to a blocked person's name. */
export function AdminBlockedBadge({ className }: { className?: string }) {
  const { t } = useAdminT();
  return (
    <Badge
      variant="outline"
      data-testid="admin-blocked-badge"
      className={cn(
        'border-0 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400',
        className,
      )}
    >
      {t('moderation.blockedBadge')}
    </Badge>
  );
}

interface AdminModerationActionsProps {
  id: string;
  name: string;
  subject: ModerationSubject;
  isBlocked?: boolean | null;
  disabled?: boolean;
  onRequest: (request: ModerationRequest) => void;
  className?: string;
}

/**
 * Block/unblock plus delete for one row or card. The delete button is separated
 * by a divider so it cannot be hit while reaching for the reversible action.
 */
export function AdminModerationActions({
  id,
  name,
  subject,
  isBlocked,
  disabled,
  onRequest,
  className,
}: AdminModerationActionsProps) {
  const { t } = useAdminT();
  const blockAction = isBlocked ? 'unblock' : 'block';
  // Only people can be blocked; a booking just gets deleted.
  const canBlock = subject !== 'booking';

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="group"
      aria-label={t('moderation.actionsLabel')}
    >
      {canBlock ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn('min-h-[44px] gap-1.5', adminActionButtonClass)}
            data-testid={`admin-${blockAction}-${id}`}
            onClick={() => onRequest({ id, name, subject, action: blockAction })}
          >
            {isBlocked ? (
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Ban className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {t(`moderation.${blockAction}`)}
          </Button>

          <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
        </>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn('min-h-[44px] gap-1.5', adminActionButtonDestructiveClass)}
        data-testid={`admin-delete-${id}`}
        onClick={() => onRequest({ id, name, subject, action: 'delete' })}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        {t('moderation.delete')}
      </Button>
    </div>
  );
}
