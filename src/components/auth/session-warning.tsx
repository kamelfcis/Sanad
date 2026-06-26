'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

type SessionWarningProps = {
  open: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
};

export function SessionWarning({
  open,
  secondsRemaining,
  onContinue,
  onLogout,
}: SessionWarningProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md border-0 p-0 shadow-2xl sm:rounded-2xl"
        dir="rtl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="rounded-2xl bg-gradient-to-br from-warning/10 via-background to-primary/5 p-6">
          <DialogHeader className="space-y-3 text-right sm:text-right">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <DialogTitle className="text-xl font-bold text-text-primary">
                تنبيه انتهاء الجلسة
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed text-text-secondary">
              سيتم تسجيل خروجك خلال{' '}
              <span className="font-bold text-primary tabular-nums">{secondsRemaining}</span>
              {' '}ثانية بسبب عدم النشاط
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex-row gap-3 sm:justify-start">
            <Button
              className="flex-1 font-semibold shadow-sm"
              onClick={onContinue}
            >
              الاستمرار
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border font-semibold"
              onClick={onLogout}
            >
              تسجيل الخروج
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
