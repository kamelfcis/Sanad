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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  const [photoErrors, setPhotoErrors] = useState<{ profile?: string; idCard?: string }>({});
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
    },
  });

  useEffect(() => {
    if (isCompleteMode && profile?.full_name) {
      reset((prev) => ({ ...prev, fullName: profile.full_name ?? '' }));
    }
  }, [isCompleteMode, profile?.full_name, reset]);

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?role=technician`,
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const onSubmit = async (data: TechnicianRegisterInput | TechnicianCompleteInput) => {
    const nextPhotoErrors: { profile?: string; idCard?: string } = {};
    if (!profilePhoto) nextPhotoErrors.profile = 'صورة شخصية مطلوبة';
    if (!idCardPhoto) nextPhotoErrors.idCard = 'صورة البطاقة مطلوبة';
    setPhotoErrors(nextPhotoErrors);
    if (Object.keys(nextPhotoErrors).length > 0) return;

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
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
      <TechnicianRegisterHero completeMode={isCompleteMode} />

      {!isCompleteMode && (
        <>
          <Button
            type="button"
            variant="outline"
            className="mb-6 w-full border-border text-text-primary hover:bg-surface"
            onClick={handleGoogleSignup}
          >
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            التسجيل بحساب Google
          </Button>

          <div className="mb-6 flex items-center gap-2">
            <Separator className="flex-1 bg-border" />
            <span className="text-xs text-text-muted">أو بالموبايل وكلمة السر</span>
            <Separator className="flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <Label className="mb-2 block">صورة شخصية + صورة البطاقة</Label>
          <div className="grid gap-4 sm:grid-cols-2">
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
              label="صورة البطاقة"
              value={idCardPhoto}
              onChange={(file) => {
                setIdCardPhoto(file);
                if (file) setPhotoErrors((prev) => ({ ...prev, idCard: undefined }));
              }}
              error={photoErrors.idCard}
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
                <Select value={field.value} onValueChange={field.onChange}>
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
                <Select value={field.value} onValueChange={field.onChange}>
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

        <Button
          type="submit"
          disabled={isSubmitting}
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
