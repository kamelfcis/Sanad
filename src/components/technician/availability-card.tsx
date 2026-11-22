'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateTechnicianProfile } from '@/hooks/use-technician';
import { toast } from '@/hooks/use-toast';
import { Wifi } from 'lucide-react';

interface AvailabilityCardProps {
  isAvailable: boolean;
  verificationStatus: string;
}

export function AvailabilityCard({ isAvailable, verificationStatus }: AvailabilityCardProps) {
  const [checked, setChecked] = useState(isAvailable);
  const updateProfile = useUpdateTechnicianProfile();
  const canToggle = verificationStatus === 'verified';

  useEffect(() => {
    setChecked(isAvailable);
  }, [isAvailable]);

  const handleChange = (next: boolean) => {
    if (!canToggle) {
      toast({
        title: 'التوثيق مطلوب',
        description: 'لا يمكن تفعيل التوفر قبل موافقة الإدارة على حسابك.',
        variant: 'destructive',
      });
      return;
    }

    const previous = checked;
    setChecked(next);
    updateProfile.mutate(
      { is_available: next },
      {
        onError: (err) => {
          setChecked(previous);
          toast({
            title: 'تعذّر تحديث التوفر',
            description: err.message,
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
          <Wifi className="h-5 w-5 text-primary" aria-hidden />
          حالة الاتصال
        </CardTitle>
        <CardDescription>تحكّم في ظهورك للعملاء واستقبال الطلبات الجديدة.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
          <Label htmlFor="technician-availability-switch" className="cursor-pointer space-y-1">
            <span className="block text-base font-medium">متاح لاستقبال الطلبات</span>
            <span className="block text-xs font-normal text-muted-foreground" lang="en">
              Available for jobs
            </span>
            {!canToggle ? (
              <span className="block text-xs text-amber-700 dark:text-amber-300">
                يتطلب حسابًا موثّقًا من الإدارة
              </span>
            ) : null}
          </Label>
          <Switch
            id="technician-availability-switch"
            data-testid="technician-availability-switch"
            checked={checked}
            onCheckedChange={handleChange}
            disabled={!canToggle || updateProfile.isPending}
            aria-label="Available for jobs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
