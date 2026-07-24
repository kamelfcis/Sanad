'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  technicianRegisterSchema,
  technicianCompleteSchema,
  type TechnicianRegisterInput,
  type TechnicianCompleteInput,
} from '@/lib/validations/technician-registration';
import {
  TECHNICIAN_SPECIALTIES,
  EGYPT_GOVERNORATES,
  phoneToTechnicianEmail,
} from '@/lib/constants/technician-registration';
import { TechnicianRegisterHero } from '@/components/auth/technician-register-layout';
import { PhotoUploadZone } from '@/components/auth/photo-upload-zone';
import { PolicyAgreement } from '@/components/auth/policy-agreement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, ArrowRight } from 'lucide-react';
import { gradients } from '@/lib/design-system';

type Mode = 'signup' | 'complete';

interface TechnicianRegistrationFormProps {
  mode?: Mode;
}

export function TechnicianRegistrationForm({ mode = 'signup' }: TechnicianRegistrationFormProps) {
  const isCompleteMode = mode === 'complete';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idCardPhoto, setIdCardPhoto] = useState<File | null>(null);
  const [idCardBackPhoto, setIdCardBackPhoto] = useState<File | null>(null);
  const [photoErrors, setPhotoErrors] = useState<{
    profile?: string;
    idCard?: string;
    idCardBack?: string;
  }>({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState<string | undefined>();
  const router = useRouter();
  const supabase = createClient();
  const { profile, setUser, setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TechnicianRegisterInput>({
    resolver: zodResolver(isCompleteMode ? technicianCompleteSchema : technicianRegisterSchema),
    defaultValues: {
      yearsExperience: 0,
      startingPrice: 100,
      fullName: profile?.full_name ?? '',
      phone: '',
      nationalId: '',
      specialty: '' as TechnicianRegisterInput['specialty'],
      governorate: '' as TechnicianRegisterInput['governorate'],
      area: '',
      workingHours: '',
      bio: '',
      ...(isCompleteMode ? {} : { password: '' }),
    },
  });

  useEffect(() => {
    if (isCompleteMode && profile?.full_name) {
      reset((prev) => ({ ...prev, fullName: profile.full_name ?? '' }));
    }
  }, [isCompleteMode, profile?.full_name, reset]);

  const onSubmit = async (data: TechnicianRegisterInput | TechnicianCompleteInput) => {
    const nextPhotoErrors: { profile?: string; idCard?: string; idCardBack?: string } = {};
    if (!profilePhoto) nextPhotoErrors.profile = 'صورة شخصية مطلوبة';
    if (!idCardPhoto) nextPhotoErrors.idCard = 'صورة وش البطاقة مطلوبة';
    if (!idCardBackPhoto) nextPhotoErrors.idCardBack = 'صورة ضهر البطاقة مطلوبة';
    setPhotoErrors(nextPhotoErrors);
    if (Object.keys(nextPhotoErrors).length > 0) return;

    if (!agreed) {
      setAgreeError('يجب الموافقة على حدود المسؤولية للمتابعة');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('nationalId', data.nationalId);
    formData.append('specialty', data.specialty);
    formData.append('yearsExperience', String(data.yearsExperience));
    formData.append('governorate', data.governorate);
    formData.append('area', data.area);
    formData.append('startingPrice', String(data.startingPrice));
    formData.append('workingHours', data.workingHours);
    formData.append('bio', data.bio);
    formData.append('profilePhoto', profilePhoto!);
    formData.append('idCardPhoto', idCardPhoto!);
    formData.append('idCardBackPhoto', idCardBackPhoto!);

    const endpoint = isCompleteMode
      ? '/api/auth/complete-technician-registration'
      : '/api/auth/register-technician';

    if (!isCompleteMode && 'password' in data) {
      formData.append('password', data.password);
    }

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok) {
        toast({
          title: 'فشل التسجيل',
          description: result.error ?? 'حدث خطأ. حاول مرة أخرى.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'تم إرسال طلب التسجيل!',
        description: result.message ?? 'سيتم مراجعة طلبك قريباً.',
      });

      if (isCompleteMode) {
        router.push('/technician/jobs');
        router.refresh();
        return;
      }

      const password = (data as TechnicianRegisterInput).password;
      const loginEmail = phoneToTechnicianEmail(data.phone);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        router.push('/auth/login');
        setIsSubmitting(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (newProfile) setProfile(newProfile);
      }

      router.push('/technician/jobs');
      router.refresh();
    } catch {
      toast({
        title: 'فشل التسجيل',
        description: 'تعذر الاتصال بالخادم. حاول مرة أخرى.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-card p-6 shadow-sm md:p-8">
      <TechnicianRegisterHero completeMode={isCompleteMode} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">الاسم بالكامل</Label>
            <Input
              id="fullName"
              placeholder="محمد أحمد"
              autoComplete="name"
              className="border-border bg-card focus:border-primary"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01xxxxxxxxx"
              autoComplete="tel"
              dir="ltr"
              className="border-border bg-card text-left focus:border-primary"
              {...register('phone')}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          {!isCompleteMode && (
            <div className="space-y-2">
              <Label htmlFor="password">كلمة السر</Label>
              <Input
                id="password"
                type="password"
                placeholder="8 أحرف على الأقل"
                autoComplete="new-password"
                className="border-border bg-card focus:border-primary"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className={`space-y-2 ${isCompleteMode ? 'sm:col-span-2' : ''}`}>
            <Label htmlFor="nationalId">الرقم القومي</Label>
            <Input
              id="nationalId"
              placeholder="14 رقم"
              maxLength={14}
              dir="ltr"
              className="border-border bg-card text-left focus:border-primary"
              {...register('nationalId')}
            />
            {errors.nationalId && (
              <p className="text-xs text-destructive">{errors.nationalId.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">صورة شخصية + صورتي البطاقة</Label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PhotoUploadZone
              label="صورة شخصية"
              value={profilePhoto}
              onChange={(file) => {
                setProfilePhoto(file);
                if (file) setPhotoErrors((prev) => ({ ...prev, profile: undefined }));
              }}
              error={photoErrors.profile}
            />
            <PhotoUploadZone
              label="وش البطاقة"
              value={idCardPhoto}
              onChange={(file) => {
                setIdCardPhoto(file);
                if (file) setPhotoErrors((prev) => ({ ...prev, idCard: undefined }));
              }}
              error={photoErrors.idCard}
            />
            <PhotoUploadZone
              label="ضهر البطاقة"
              value={idCardBackPhoto}
              onChange={(file) => {
                setIdCardBackPhoto(file);
                if (file) setPhotoErrors((prev) => ({ ...prev, idCardBack: undefined }));
              }}
              error={photoErrors.idCardBack}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>التخصص</Label>
            <Controller
              name="specialty"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNICIAN_SPECIALTIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.specialty && (
              <p className="text-xs text-destructive">{errors.specialty.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsExperience">سنين الخبرة</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              className="border-border bg-card focus:border-primary"
              {...register('yearsExperience')}
            />
            {errors.yearsExperience && (
              <p className="text-xs text-destructive">{errors.yearsExperience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>المحافظة</Label>
            <Controller
              name="governorate"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <SelectItem key={gov} value={gov}>
                        {gov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.governorate && (
              <p className="text-xs text-destructive">{errors.governorate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">المنطقة / الحي</Label>
            <Input
              id="area"
              placeholder="مدينة نصر، المعادي..."
              className="border-border bg-card focus:border-primary"
              {...register('area')}
            />
            {errors.area && <p className="text-xs text-destructive">{errors.area.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingPrice">سعر بداية الخدمة (ج.م)</Label>
            <Input
              id="startingPrice"
              type="number"
              min={1}
              dir="ltr"
              className="border-border bg-card text-left focus:border-primary"
              {...register('startingPrice')}
            />
            {errors.startingPrice && (
              <p className="text-xs text-destructive">{errors.startingPrice.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workingHours">ساعات العمل</Label>
            <Input
              id="workingHours"
              placeholder="9 ص - 6 م"
              className="border-border bg-card focus:border-primary"
              {...register('workingHours')}
            />
            {errors.workingHours && (
              <p className="text-xs text-destructive">{errors.workingHours.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">نبذة عنك</Label>
          <Textarea
            id="bio"
            placeholder="اكتب عن خبرتك وتخصصك ونوع الشغل اللي بتقدمه..."
            className="min-h-[100px] border-border bg-card focus:border-primary"
            {...register('bio')}
          />
          {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
        </div>

        <PolicyAgreement
          checked={agreed}
          onCheckedChange={(value) => {
            setAgreed(value);
            if (value) setAgreeError(undefined);
          }}
          error={agreeError}
        />

        <Button
          type="submit"
          disabled={isSubmitting || !agreed}
          className="w-full py-6 text-base font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105"
          style={{ background: gradients.primary }}
        >
          {isSubmitting ? (
            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="ml-2 h-5 w-5" />
          )}
          إرسال طلب التسجيل
        </Button>

        {!isCompleteMode && (
          <p className="text-center text-sm text-text-secondary">
            عميل؟{' '}
            <Link
              href="/auth/register?role=customer"
              className="font-medium text-primary hover:underline"
            >
              سجّل كعميل
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
