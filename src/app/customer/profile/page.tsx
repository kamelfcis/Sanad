'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerProfileSchema, type CustomerProfileInput } from '@/lib/validations/customer-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookingLocationPicker } from '@/components/maps/booking-location-picker';
import { CAIRO_DEFAULT } from '@/lib/geo';
import { normalizeEgyptCoords } from '@/lib/geo/normalize-coords';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CustomerProfileInput>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      default_location_lat: CAIRO_DEFAULT.lat,
      default_location_lng: CAIRO_DEFAULT.lng,
    },
  });

  const address = watch('default_address') ?? '';
  const lat = watch('default_location_lat');
  const lng = watch('default_location_lng');
  const pinTouched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/customer/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const current = getValues();
        const keepPin = pinTouched.current;
        const savedLat = data.default_location_lat;
        const savedLng = data.default_location_lng;
        const loadedLat =
          savedLat == null ? CAIRO_DEFAULT.lat : Number(savedLat);
        const loadedLng =
          savedLng == null ? CAIRO_DEFAULT.lng : Number(savedLng);
        const loaded = normalizeEgyptCoords(
          Number.isFinite(loadedLat) ? loadedLat : CAIRO_DEFAULT.lat,
          Number.isFinite(loadedLng) ? loadedLng : CAIRO_DEFAULT.lng,
        );
        reset({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          default_address: keepPin ? current.default_address ?? '' : data.default_address ?? '',
          default_location_lat: keepPin ? current.default_location_lat : loaded.lat,
          default_location_lng: keepPin ? current.default_location_lng : loaded.lng,
          default_apartment_number: data.default_apartment_number ?? '',
          default_floor_number: data.default_floor_number ?? '',
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getValues, reset]);

  const onSubmit = async (values: CustomerProfileInput) => {
    setSaving(true);
    const res = await fetch('/api/customer/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: 'تعذّر حفظ البيانات',
        description: body.error ?? 'حاول مرة أخرى',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'تم حفظ ملفك الشخصي' });
  };

  if (loading) {
    return (
      <div className="container max-w-lg py-8" dir="rtl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-8" dir="rtl">
      <h1 className="mb-2 text-2xl font-bold">ملفي كعميل</h1>
      <p className="mb-6 text-sm text-muted-foreground">يُستخدم العنوان الافتراضي لتعبئة نموذج الحجز تلقائياً.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="full_name">الاسم</Label>
          <Input id="full_name" className="mt-1" {...register('full_name')} />
          {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">رقم الموبايل</Label>
          <Input id="phone" dir="ltr" className="mt-1 text-left" placeholder="01xxxxxxxxx" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <BookingLocationPicker
          address={address}
          lat={lat ?? CAIRO_DEFAULT.lat}
          lng={lng ?? CAIRO_DEFAULT.lng}
          onAddressChange={(value) => setValue('default_address', value, { shouldValidate: true })}
          onCoordsChange={({ lat: nextLat, lng: nextLng }) => {
            pinTouched.current = true;
            const point = normalizeEgyptCoords(nextLat, nextLng);
            setValue('default_location_lat', point.lat);
            setValue('default_location_lng', point.lng);
          }}
          error={errors.default_address?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="default_floor_number">الدور</Label>
            <Input id="default_floor_number" className="mt-1" {...register('default_floor_number')} />
          </div>
          <div>
            <Label htmlFor="default_apartment_number">الشقة</Label>
            <Input id="default_apartment_number" className="mt-1" {...register('default_apartment_number')} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          حفظ
        </Button>
      </form>
    </div>
  );
}
