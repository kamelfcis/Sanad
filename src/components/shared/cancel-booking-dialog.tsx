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
import { Label } from '@/components/ui/label';
import { useCancelBooking } from '@/hooks/use-bookings';
import { toast } from '@/hooks/use-toast';

interface CancelBookingDialogProps {
  bookingId: string;
  serviceNameAr?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  bookingId,
  serviceNameAr,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingDialogProps) {
  const cancelBooking = useCancelBooking();
  const [reason, setReason] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (cancelBooking.isPending) return;
    if (!next) setReason('');
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (!bookingId) return;
    const trimmed = reason.trim();
    cancelBooking.mutate(
      { id: bookingId, reason: trimmed || undefined },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
          toast({
            title: 'تم إلغاء الطلب',
            description: 'تم إلغاء طلب الخدمة بنجاح.',
          });
          onSuccess?.();
        },
        onError: (err) => {
          toast({
            title: 'تعذّر إلغاء الطلب',
            description: err instanceof Error ? err.message : 'حدث خطأ أثناء الإلغاء.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent dir="rtl" data-testid="cancel-booking-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد إلغاء الطلب</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من إلغاء طلب «{serviceNameAr?.trim() || 'الخدمة'}»؟ لا يمكن التراجع عن هذا
            الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">سبب الإلغاء (اختياري)</Label>
          <Textarea
            id="cancel-reason"
            data-testid="cancel-booking-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            placeholder="مثال: لم أعد بحاجة للخدمة"
            rows={3}
            maxLength={500}
            className="resize-none"
            disabled={cancelBooking.isPending}
          />
          <p className="text-xs text-muted-foreground">{reason.length}/500</p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={cancelBooking.isPending}>تراجع</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            data-testid="cancel-booking-confirm"
            disabled={cancelBooking.isPending}
            onClick={handleConfirm}
          >
            {cancelBooking.isPending ? 'جارٍ الإلغاء…' : 'نعم، إلغاء الطلب'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
