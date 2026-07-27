'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Ban, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ModerationAction = 'block' | 'unblock' | 'delete';

const ACTION_CONFIG: Record<
  ModerationAction,
  { icon: typeof Ban; iconClass: string; confirmClass: string }
> = {
  block: {
    icon: Ban,
    iconClass: 'bg-amber-100 text-amber-700',
    confirmClass: 'bg-amber-600 hover:bg-amber-700',
  },
  unblock: {
    icon: ShieldCheck,
    iconClass: 'bg-emerald-100 text-emerald-700',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
  delete: {
    icon: Trash2,
    iconClass: 'bg-red-100 text-red-700',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
};

interface AdminModerationDialogProps {
  open: boolean;
  action: ModerationAction | null;
  /** Optional free-text reason, stored on the profile and in the audit log. */
  showReason?: boolean;
  /**
   * When set, the admin must type this exact string before confirming. Used for
   * deletes, which are irreversible and must not be a single misclick.
   */
  confirmPhrase?: string;
  isPending?: boolean;
  /** Overridden by the bulk dialog so tests can tell the two apart. */
  testId?: string;
  labels: {
    title: string;
    description: string;
    /** Extra line spelling out what else gets removed. Deletes only. */
    consequences?: string;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    confirmPhraseLabel?: string;
    confirm: string;
    cancel: string;
  };
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export function AdminModerationDialog({
  open,
  action,
  showReason = false,
  confirmPhrase,
  isPending = false,
  testId = 'admin-moderation-dialog',
  labels,
  onConfirm,
  onCancel,
}: AdminModerationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      {/*
        Radix unmounts the content when the dialog closes, which is what resets
        the reason and the typed confirmation — a phrase typed for one target
        must never carry over to the next.
      */}
      <AlertDialogContent
        data-testid={testId}
        className="border-[#FF6B00]/20 sm:max-w-md"
      >
        <ModerationDialogBody
          action={action}
          showReason={showReason}
          confirmPhrase={confirmPhrase}
          isPending={isPending}
          labels={labels}
          onConfirm={onConfirm}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ModerationDialogBody({
  action,
  showReason,
  confirmPhrase,
  isPending,
  labels,
  onConfirm,
}: Pick<
  AdminModerationDialogProps,
  'action' | 'showReason' | 'confirmPhrase' | 'isPending' | 'labels' | 'onConfirm'
>) {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');

  const config = action ? ACTION_CONFIG[action] : null;
  const Icon = config?.icon ?? Ban;
  const phraseMatches = !confirmPhrase || typed.trim() === confirmPhrase.trim();
  const canConfirm = phraseMatches && !isPending && !!action;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(showReason ? reason.trim() || undefined : undefined);
  };

  return (
    <>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {config ? (
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  config.iconClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <AlertDialogTitle>{labels.title}</AlertDialogTitle>
              <AlertDialogDescription>{labels.description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {labels.consequences ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {labels.consequences}
          </p>
        ) : null}

        {showReason ? (
          <div className="space-y-2">
            <label htmlFor="moderation-reason" className="text-sm font-medium">
              {labels.reasonLabel}
            </label>
            <Textarea
              id="moderation-reason"
              data-testid="admin-moderation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={labels.reasonPlaceholder}
              rows={3}
              className="resize-none"
            />
          </div>
        ) : null}

        {confirmPhrase ? (
          <div className="space-y-2">
            <label htmlFor="moderation-phrase" className="text-sm font-medium">
              {labels.confirmPhraseLabel}
            </label>
            <Input
              id="moderation-phrase"
              data-testid="admin-moderation-phrase"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
              className="min-h-[44px]"
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{labels.cancel}</AlertDialogCancel>
          <Button
            type="button"
            data-testid="admin-moderation-confirm"
            className={cn('text-white', config?.confirmClass)}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {labels.confirm}
          </Button>
        </AlertDialogFooter>
    </>
  );
}
