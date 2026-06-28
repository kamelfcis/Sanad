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
import { Textarea } from '@/components/ui/textarea';
import { Ban, CheckCircle, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type TechnicianStatusAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

const ACTION_CONFIG: Record<
  TechnicianStatusAction,
  {
    icon: typeof CheckCircle;
    iconClass: string;
    confirmClass: string;
  }
> = {
  approve: {
    icon: CheckCircle,
    iconClass: 'bg-emerald-100 text-emerald-600',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
  reject: {
    icon: XCircle,
    iconClass: 'bg-red-100 text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
  suspend: {
    icon: Ban,
    iconClass: 'bg-zinc-100 text-zinc-600',
    confirmClass: 'bg-zinc-700 hover:bg-zinc-800',
  },
  reactivate: {
    icon: RotateCcw,
    iconClass: 'bg-blue-100 text-blue-600',
    confirmClass: 'bg-blue-600 hover:bg-blue-700',
  },
};

interface AdminStatusConfirmDialogProps {
  open: boolean;
  action: TechnicianStatusAction | null;
  technicianName: string;
  requiresReason?: boolean;
  isPending?: boolean;
  labels: {
    title: string;
    description: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    confirm: string;
    cancel: string;
  };
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export function AdminStatusConfirmDialog({
  open,
  action,
  technicianName: _technicianName,
  requiresReason = false,
  isPending = false,
  labels,
  onConfirm,
  onCancel,
}: AdminStatusConfirmDialogProps) {
  const [reason, setReason] = useState('');

  const config = action ? ACTION_CONFIG[action] : null;
  const Icon = config?.icon ?? CheckCircle;
  const canConfirm = !requiresReason || reason.trim().length > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason('');
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(requiresReason ? reason.trim() : undefined);
    setReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        data-testid="admin-status-confirm-dialog"
        className="border-[#FF6B00]/20 sm:max-w-md"
      >
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

        {requiresReason ? (
          <div className="space-y-2">
            <label htmlFor="status-reason" className="text-sm font-medium text-zinc-700">
              {labels.reasonLabel}
            </label>
            <Textarea
              id="status-reason"
              data-testid="admin-status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={labels.reasonPlaceholder}
              rows={3}
              className="resize-none"
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{labels.cancel}</AlertDialogCancel>
          <Button
            type="button"
            data-testid="admin-status-confirm-btn"
            className={cn('text-white', config?.confirmClass)}
            disabled={!canConfirm || isPending || !action}
            onClick={handleConfirm}
          >
            {labels.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
