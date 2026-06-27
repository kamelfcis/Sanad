'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations/booking';
import { useCategories } from '@/hooks/use-categories';
import { useService, useServices } from '@/hooks/use-services';
import { useFormatMoney } from '@/hooks/use-site-settings';
import { useCreateBooking } from '@/hooks/use-bookings';
import { useUpload } from '@/hooks/use-upload';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingLocationPicker } from '@/components/maps/booking-location-picker';
import { CAIRO_DEFAULT } from '@/lib/geo';

interface BookingFormProps {
  defaultServiceId?: string;
  defaultTechnicianId?: string;
}

export function BookingForm({ defaultServiceId, defaultTechnicianId }: BookingFormProps) {
  const router = useRouter();
  const { formatMoneyOrEstimate } = useFormatMoney();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const lockedService = Boolean(defaultServiceId && defaultTechnicianId);

  const { data: categories } = useCategories();
  const { data: preselectedService, isLoading: preselectedLoading, isError: preselectedError } =
    useService(lockedService ? defaultServiceId : undefined);
  const { data: allServices } = useServices(undefined, { enabled: !lockedService });
  const createBooking = useCreateBooking();
  const upload = useUpload();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      image_urls: [],
      technician_id: defaultTechnicianId,
      service_id: defaultServiceId,
      location_lat: CAIRO_DEFAULT.lat,
      location_lng: CAIRO_DEFAULT.lng,
    },
  });

  const imageUrls = watch('image_urls') ?? [];
  const locationAddress = watch('location_address') ?? '';
  const locationLat = watch('location_lat');
  const locationLng = watch('location_lng');
  const selectedServiceId = watch('service_id');

  const { data: categoryServices } = useServices(selectedCategory ?? undefined, {
    enabled: !lockedService && !!selectedCategory,
  });

  const matchedService = lockedService
    ? preselectedService
    : allServices?.find((service) => service.id === selectedServiceId);

  useEffect(() => {
    if (defaultTechnicianId) {
      setValue('technician_id', defaultTechnicianId);
    }
  }, [defaultTechnicianId, setValue]);

  useEffect(() => {
    if (!defaultServiceId) return;

    if (preselectedService) {
      setValue('service_id', preselectedService.id, { shouldValidate: true });
      setSelectedCategory(preselectedService.service_categories.slug);
      return;
    }

    if (!allServices?.length) return;

    const matched = allServices.find((service) => service.id === defaultServiceId);
    if (matched) {
      setSelectedCategory(matched.service_categories.slug);
      setValue('service_id', matched.id, { shouldValidate: true });
    }
  }, [allServices, defaultServiceId, preselectedService, setValue]);

  const onSubmit = async (data: CreateBookingInput) => {
    try {
      const booking = await createBooking.mutateAsync(data);

      if (booking) {
        toast({
          title: 'تم إرسال الطلب',
          description: defaultTechnicianId
            ? 'تم إرسال طلبك للصنايعي المختار.'
            : 'تم إرسال طلب الخدمة وسيتم مطابقتك مع صنايعي مناسب.',
        });
        router.push(`/customer/bookings/${booking.id}`);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'تعذّر إرسال الطلب',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const onInvalid = () => {
    toast({
      title: 'يرجى إكمال البيانات',
      description: 'تأكد من اختيار الخدمة ووصف المشكلة وموقع الخدمة.',
      variant: 'destructive',
    });
  };

  const serviceLoading = lockedService && preselectedLoading;
  const serviceLoadFailed = lockedService && preselectedError;

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6" dir="rtl">
      {defaultTechnicianId && (
        <input type="hidden" {...register('technician_id')} />
      )}

      {defaultServiceId && (
        <input type="hidden" {...register('service_id')} />
      )}

      <input type="hidden" {...register('location_address')} />
      <input type="hidden" {...register('location_lat', { valueAsNumber: true })} />
      <input type="hidden" {...register('location_lng', { valueAsNumber: true })} />

      {/* Service Selection */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium">الخدمة</legend>
        {lockedService ? (
          serviceLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : serviceLoadFailed || !matchedService ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              تعذّر تحميل بيانات الخدمة. يرجى العودة واختيار الخدمة مرة أخرى.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium text-text-primary">{matchedService.name_ar}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {formatMoneyOrEstimate(matchedService.price)}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div>
              <Label>التصنيف</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setValue('service_id', '' as never, { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نوع الخدمة</Label>
              <Select onValueChange={(value) => setValue('service_id', value, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory ? 'اختر الخدمة' : 'اختر التصنيف أولاً'} />
                </SelectTrigger>
                <SelectContent>
                  {categoryServices?.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name_ar} — {formatMoneyOrEstimate(svc.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_id && (
                <p className="mt-1 text-xs text-destructive">{errors.service_id.message}</p>
              )}
            </div>
          </div>
        )}
        {lockedService && errors.service_id && (
          <p className="mt-1 text-xs text-destructive">{errors.service_id.message}</p>
        )}
      </fieldset>

      {/* Description */}
      <fieldset>
        <Label htmlFor="description">وصف المشكلة</Label>
        <Textarea
          id="description"
          placeholder="اشرح ما يحتاج إصلاح أو تنفيذ..."
          className="mt-1 min-h-[100px]"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </fieldset>

      {/* Location */}
      <fieldset>
        <BookingLocationPicker
          address={locationAddress}
          lat={locationLat}
          lng={locationLng}
          onAddressChange={(value) => setValue('location_address', value, { shouldValidate: true })}
          onCoordsChange={({ lat, lng }) => {
            setValue('location_lat', lat);
            setValue('location_lng', lng);
          }}
          error={errors.location_address?.message}
        />
      </fieldset>

      {/* Preferred Time */}
      <fieldset>
        <Label htmlFor="preferred_time">الوقت المفضل (اختياري)</Label>
        <Input
          id="preferred_time"
          type="datetime-local"
          className="mt-1"
          {...register('preferred_time')}
        />
      </fieldset>

      {/* Image Upload */}
      <fieldset>
        <Label>صور (اختياري — حد أقصى 5)</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          ارفع صوراً للمشكلة لمساعدة الصنايعي على فهم العمل المطلوب.
        </p>
        <ImageUploader
          urls={imageUrls}
          onUpload={async (file) => {
            const url = await upload.uploadFile(file);
            if (url) {
              setValue('image_urls', [...imageUrls, url]);
            }
            return url;
          }}
          onRemove={(url) => {
            setValue(
              'image_urls',
              imageUrls.filter((u) => u !== url),
            );
          }}
          uploading={upload.uploading}
          error={upload.error}
        />
      </fieldset>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={createBooking.isPending || upload.uploading || serviceLoading}
      >
        {(createBooking.isPending || upload.uploading) && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        )}
        إرسال الطلب
      </Button>
    </form>
  );
}
