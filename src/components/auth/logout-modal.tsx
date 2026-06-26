'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout, type LogoutScope } from '@/lib/auth/logout';
import { useAdminI18nOptional } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

type LogoutModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: LogoutScope;
};

export function LogoutModal({ open, onOpenChange, scope = 'local' }: LogoutModalProps) {
  const [loading, setLoading] = useState(false);
  const adminI18n = useAdminI18nOptional();

  const labels = adminI18n
    ? {
        title: adminI18n.t('logoutModal.title'),
        description: adminI18n.t('logoutModal.description'),
        cancel: adminI18n.t('logoutModal.cancel'),
        confirm: adminI18n.t('logoutModal.confirm'),
        loading: adminI18n.t('logoutModal.loading'),
        dir: adminI18n.dir,
        textAlign: adminI18n.dir === 'ltr' ? 'text-left' : 'text-right',
        footerJustify: adminI18n.dir === 'ltr' ? 'sm:justify-end' : 'sm:justify-start',
      }
    : {
        title: 'تسجيل الخروج',
        description: 'هل تريد تسجيل الخروج من هذا الجهاز؟',
        cancel: 'إلغاء',
        confirm: 'تسجيل الخروج',
        loading: 'جاري الخروج…',
        dir: 'rtl' as const,
        textAlign: 'text-right',
        footerJustify: 'sm:justify-start',
      };

  const handleConfirm = async () => {
    setLoading(true);
    onOpenChange(false);
    try {
      await logout({ scope });
    } catch (err) {
      console.error('[logout] modal sign-out failed:', err);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-0 p-0 shadow-2xl sm:rounded-2xl"
        dir={labels.dir}
      >
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
          <DialogHeader className={cn('space-y-3', labels.textAlign)}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-xl font-bold text-text-primary">
                {labels.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed text-text-secondary">
              {labels.description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className={cn('mt-6 flex-row gap-3', labels.footerJustify)}>
            <Button
              variant="outline"
              className="flex-1 border-border font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {labels.cancel}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 font-semibold shadow-sm"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? labels.loading : labels.confirm}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
