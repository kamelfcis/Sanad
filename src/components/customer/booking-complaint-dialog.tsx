'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createComplaintSchema, type CreateComplaintInput } from '@/lib/validations/complaints';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BookingComplaintDialogProps {
  bookingId: string;
  disabled?: boolean;
}

export function BookingComplaintDialog({ bookingId, disabled }: BookingComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: { booking_id: bookingId, body: '' },
  });

  const onSubmit = async (data: CreateComplaintInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: 'تعذّر إرسال الشكوى',
          description: result.error ?? 'حاول مرة أخرى',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'تم استلام شكواك', description: 'سيراجعها فريق سند.' });
      reset({ booking_id: bookingId, body: '' });
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          قدّم شكوى
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقديم شكوى</DialogTitle>
          <DialogDescription>
            اشرح المشكلة بوضوح. مسار الشكوى منفصل عن التقييم ولا يؤثر عليه.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('booking_id')} />
          <div className="space-y-2">
            <Label htmlFor="complaint-body">تفاصيل الشكوى</Label>
            <Textarea
              id="complaint-body"
              rows={5}
              placeholder="ما الذي حدث؟"
              {...register('body')}
            />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إرسال
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
