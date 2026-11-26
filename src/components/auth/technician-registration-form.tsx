'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  technicianRegisterSchema,
  technicianCompleteSchema,
  type TechnicianRegisterInput,
  type TechnicianCompleteInput,
} from '@/lib/validations/technician-registration';
import {
  EGYPT_GOVERNORATES,
  CAPACITY_TIERS,
  CONTRACTOR_KINDS,
  SPECIALIST_CONTRACTOR_SPECIALTIES,
  TEAM_SIZES,
  TECHNICIAN_SPECIALTIES,
  TECHNICIAN_TRADE_SPECIALTIES,
  teamSizeLabel,
  phoneToTechnicianEmail,
} from '@/lib/constants/technician-registration';
import { TechnicianRegisterHero } from '@/components/auth/technician-register-layout';
import { RegisterPathBadge } from '@/components/auth/register-role-chrome';
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
import { MAX_REGISTRATION_FORM_TOTAL_BYTES } from '@/lib/validations/registration-upload';

type Mode = 'signup' | 'complete';
type InitialPaymentChoice = 'now' | 'later';

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
  const [initialPaymentChoice, setInitialPaymentChoice] = useState<InitialPaymentChoice>('later');
  const [agreeError, setAgreeError] = useState<string | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const asContractor = searchParams.get('as') === 'contractor';
  const lockedRole = asContractor ? 'contractor' : 'technician';
  const supabase = createClient();
  const { profile, setUser, setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TechnicianRegisterInput>({
    resolver: zodResolver(isCompleteMode ? technicianCompleteSchema : technicianRegisterSchema),
    defaultValues: {
      yearsExperience: 0,
      startingPrice: 100,
      fullName: profile?.full_name ?? '',
      phone: '',
      nationalId: '',
      providerRole: asContractor ? 'contractor' : 'technician',
      contractorKind: 'specialist',
      capacityTier: 'low',
      teamSize: 5,
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

  useEffect(() => {
    setValue('providerRole', lockedRole);
  }, [lockedRole, setValue]);

  const contractorKind = useWatch({ control, name: 'contractorKind' });
  const isContractor = lockedRole === 'contractor';
  const specialtyOptions = !isContractor
    ? TECHNICIAN_TRADE_SPECIALTIES
    : contractorKind === 'integrated'
      ? TECHNICIAN_SPECIALTIES.filter((item) => item.value === 'general-contractor')
      : SPECIALIST_CONTRACTOR_SPECIALTIES;

  const onSubmit = async (data: TechnicianRegisterInput | TechnicianCompleteInput) => {
    const nextPhotoErrors: { profile?: string; idCard?: string; idCardBack?: string } = {};
    if (!profilePhoto) nextPhotoErrors.profile = 'صورة شخصية مطلوبة';
    if (!idCardPhoto) nextPhotoErrors.idCard = 'صورة وش البطاقة مطلوبة';
    if (!idCardBackPhoto) nextPhotoErrors.idCardBack = 'صورة ضهر البطاقة مطلوبة';
    setPhotoErrors(nextPhotoErrors);
    if (Object.keys(nextPhotoErrors).length > 0) return;

    const photosTotal =
      (profilePhoto?.size ?? 0) + (idCardPhoto?.size ?? 0) + (idCardBackPhoto?.size ?? 0);
    if (photosTotal > MAX_REGISTRATION_FORM_TOTAL_BYTES) {
      const tooLargeMsg =
        'حجم الصور الثلاث كبير جداً حتى بعد الضغط. اختر صوراً أصغر أو أعد التقاطها بجودة أقل.';
      setPhotoErrors({
        profile: tooLargeMsg,
        idCard: tooLargeMsg,
        idCardBack: tooLargeMsg,
      });
      toast({
        title: 'حجم الصور كبير',
        description: tooLargeMsg,
        variant: 'destructive',
      });
      return;
    }

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
    formData.append('providerRole', lockedRole);
    if (lockedRole === 'contractor') {
      if (data.contractorKind) formData.append('contractorKind', data.contractorKind);
      if (data.capacityTier) formData.append('capacityTier', data.capacityTier);
      if (data.teamSize) formData.append('teamSize', String(data.teamSize));
    }
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

      if (res.status === 413) {
        toast({
          title: 'حجم الصور كبير جداً',
          description:
            'تم ضغط الصور تلقائياً — جرّب صور أصغر أو أعد المحاولة.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'فشل التسجيل',
          description:
            typeof result.error === 'string' ? result.error : 'حدث خطأ. حاول مرة أخرى.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'تم إرسال طلب التسجيل!',
        description:
          result.message ??
          `سيتم مراجعة طلبك. بعد الموافقة ادخل برقم ${data.phone} وكلمة المرور التي اخترتها.`,
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
        router.push(initialPaymentChoice === 'now' ? '/auth/login?next=%2Ftechnician%2Fsubscription%3Fstart%3D1' : '/auth/login');
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

      router.push(initialPaymentChoice === 'now' ? '/technician/subscription?start=1' : '/technician/jobs');
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
      <RegisterPathBadge audience={isContractor ? 'contractor' : 'technician'} />
      <div className="mt-6">
        <TechnicianRegisterHero
          completeMode={isCompleteMode}
          audience={isContractor ? 'contractor' : 'technician'}
        />
      </div>

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
          {isContractor && (
            <>
          <div className="space-y-2">
            <Label>نوع المقاول</Label>
            <Controller
              name="contractorKind"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const previous = field.value;
                    field.onChange(value);
                    if (value === 'integrated') {
                      setValue('specialty', 'general-contractor');
                    } else if (previous === 'integrated') {
                      setValue('specialty', '' as TechnicianRegisterInput['specialty']);
                    }
                  }}
                >
                  <SelectTrigger id="contractor-kind" className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACTOR_KINDS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.contractorKind && (
              <p className="text-xs text-destructive">{errors.contractorKind.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>السعة الحالية</Label>
            <Controller
              name="capacityTier"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="capacity-tier" className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="اختر السعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACITY_TIERS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.capacityTier && (
              <p className="text-xs text-destructive">{errors.capacityTier.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>حجم الفريق</Label>
            <Controller
              name="teamSize"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger id="team-size" className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="5 أو 10 أو 20" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {teamSizeLabel(size)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.teamSize && (
              <p className="text-xs text-destructive">{errors.teamSize.message}</p>
            )}
          </div>
            </>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label>التخصص</Label>
            <Controller
              name="specialty"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="specialty" className="border-border bg-card focus:border-primary">
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions.map((item) => (
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
                  <SelectTrigger id="governorate" className="border-border bg-card focus:border-primary">
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

        {!isCompleteMode && (
          <section className="space-y-3 rounded-2xl border border-border bg-surface/40 p-4" aria-labelledby="registration-payment-choice">
            <div>
              <h2 id="registration-payment-choice" className="font-semibold text-text-primary">اشتراك الظهور للعملاء</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                الاشتراك 10 جنيهات شهرياً. تقدر تدفع بعد التسجيل أو تكمل التسجيل وتدفع لاحقاً.
                يبدأ الشهر بعد مراجعة الأدمن وإقرار الإيصال.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['now', 'هسدد الآن', 'بعد إنشاء الحساب هتنتقل لخطوات الدفع ورفع الإيصال.'],
                ['later', 'هسدد لاحقاً', 'كمّل التسجيل، وادفع من صفحة الاشتراك في أي وقت.'],
              ] as const).map(([value, title, description]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={initialPaymentChoice === value}
                  onClick={() => setInitialPaymentChoice(value)}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    initialPaymentChoice === value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="block font-semibold text-text-primary">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-text-secondary">{description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

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
            <Link
              href="/auth/register"
              className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              تغيير نوع الحساب
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
