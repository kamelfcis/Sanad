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

type LogoutModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: LogoutScope;
};

export function LogoutModal({ open, onOpenChange, scope = 'local' }: LogoutModalProps) {
  const [loading, setLoading] = useState(false);

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
        dir="rtl"
      >
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
          <DialogHeader className="space-y-3 text-right sm:text-right">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-xl font-bold text-text-primary">
                تسجيل الخروج
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed text-text-secondary">
              هل تريد تسجيل الخروج من هذا الجهاز؟
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex-row gap-3 sm:justify-start">
            <Button
              variant="outline"
              className="flex-1 border-border font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1 font-semibold shadow-sm"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'جاري الخروج…' : 'تسجيل الخروج'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
