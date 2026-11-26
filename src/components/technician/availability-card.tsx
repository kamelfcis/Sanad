'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUpdateTechnicianProfile } from '@/hooks/use-technician';
import { useProviderSubscription } from '@/hooks/use-provider-subscription';
import { toast } from '@/hooks/use-toast';

interface AvailabilityCardProps {
  isAvailable: boolean;
  verificationStatus: string;
}

export function AvailabilityCard({ isAvailable, verificationStatus }: AvailabilityCardProps) {
  const [checked, setChecked] = useState(isAvailable);
  const updateProfile = useUpdateTechnicianProfile();
  const subscription = useProviderSubscription();
  const subscriptionActive = subscription.data?.isActive === true;
  const pendingPayment = subscription.data?.pendingPayment;
  const isVerified = verificationStatus === 'verified';
  const canToggle = isVerified && subscriptionActive;

  useEffect(() => {
    setChecked(isAvailable && subscriptionActive);
  }, [isAvailable, subscriptionActive]);

  const handleChange = (next: boolean) => {
    if (!canToggle) return;
    const previous = checked;
    setChecked(next);
    updateProfile.mutate(
      { is_available: next },
      {
        onError: (error) => {
          setChecked(previous);
          toast({
            title: 'تعذر تحديث ظهور الملف',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {checked ? <Eye className="h-5 w-5 text-primary" aria-hidden="true" /> : <EyeOff className="h-5 w-5 text-primary" aria-hidden="true" />}
          ظهور الملف الشخصي
        </CardTitle>
        <CardDescription>
          تحكم في ظهور ملفك للعملاء واستقبال طلبات الشغل. تقدر توقف الظهور وتفعّله في أي وقت.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <Label htmlFor="technician-availability-switch" className="cursor-pointer space-y-1">
            <span className="block text-base font-medium">
              {checked ? 'ملفي ظاهر للعملاء' : 'ملفي مخفي عن العملاء'}
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              {isVerified && subscriptionActive
                ? `الاشتراك ساري حتى ${new Date(subscription.data!.activeUntil!).toLocaleDateString('ar-EG')}`
                : !isVerified
                  ? 'سيظهر الملف بعد توثيق الحساب وتفعيل الاشتراك.'
                  : pendingPayment
                    ? 'تم استلام الإيصال. سيظهر الملف بعد مراجعة الأدمن.'
                    : 'فعّل اشتراكك الشهري لتقدر تعرض ملفك للعملاء.'}
            </span>
          </Label>
          <Switch
            id="technician-availability-switch"
            data-testid="technician-availability-switch"
            checked={checked}
            onCheckedChange={handleChange}
            disabled={!canToggle || subscription.isLoading || updateProfile.isPending}
            aria-label="إظهار الملف الشخصي للعملاء واستقبال طلبات الشغل"
          />
        </div>

        {!subscriptionActive && !subscription.isLoading && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-sm text-text-secondary">
              {pendingPayment ? (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600" aria-hidden="true" />
              ) : (
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <span>
                {!isVerified
                  ? 'تقدر تدفع الآن أو بعدين من هنا، لكن الملف مش هيظهر قبل توثيق الحساب.'
                  : pendingPayment
                  ? 'إيصال الدفع قيد المراجعة. هنبلغك بحالة التفعيل.'
                  : 'ادفع 10 جنيهات شهرياً وارفع الإيصال لتفعيل ظهور الملف.'}
              </span>
            </div>
            <Button asChild size="sm" variant={pendingPayment ? 'outline' : 'default'}>
              <Link href="/technician/subscription">
                {pendingPayment ? 'عرض حالة الطلب' : 'إدارة الاشتراك والدفع'}
              </Link>
            </Button>
          </div>
        )}

        {subscriptionActive && !subscription.isLoading && (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isVerified
              ? 'وافق الأدمن على الدفع. اختار إظهار الملف لاستقبال طلبات الشغل.'
              : 'تم تفعيل الاشتراك. سيظهر ملفك بعد توثيق الحساب من الإدارة.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
