'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTechnicianProfile, useUpdateTechnicianProfile, useTechnicianSkills, useUpdateTechnicianSkills } from '@/hooks/use-technician';
import { useTechnicianReviews } from '@/hooks/use-reviews';
import { useAuthStore } from '@/store/auth-store';
import { getTechnicianProfileMissingFields } from '@/lib/technician/profile-complete';
import { SkillSelector } from '@/components/shared/skill-selector';
import { RatingSummary } from '@/components/shared/rating-summary';
import { ReviewCard } from '@/components/shared/review-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Star, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const profileSchema = z.object({
  bio: z.string().min(10).max(500).optional().or(z.literal('')),
  years_experience: z.coerce.number().min(0).max(70).optional(),
  max_distance_km: z.coerce.number().min(1).max(200).optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function TechnicianProfilePage() {
  const { data: techProfile, isLoading, isError, error, refetch } = useTechnicianProfile();
  const { data: techSkills } = useTechnicianSkills();
  const { data: reviews } = useTechnicianReviews(techProfile?.id ?? '');
  const updateProfile = useUpdateTechnicianProfile();
  const updateSkills = useUpdateTechnicianSkills();
  const { profile: userProfile } = useAuthStore();

  const [isAvailable, setIsAvailable] = useState(techProfile?.is_available ?? false);

  useEffect(() => {
    // Sync the availability toggle to the loaded server value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (techProfile) setIsAvailable(techProfile.is_available);
  }, [techProfile]);
  const [selectedSkills, setSelectedSkills] = useState<
    { service_id: string; price_override: number | null }[]
  >([]);
  // Whether selectedSkills has been hydrated from the server. Until this is true
  // the selector has not loaded, so we must NOT persist selectedSkills (an empty
  // array here would wipe the technician's real skills and lock them out).
  const [skillsHydrated, setSkillsHydrated] = useState(false);

  useEffect(() => {
    if (!techSkills || skillsHydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSkills(
      techSkills.map((s) => ({ service_id: s.service_id, price_override: s.price_override })),
    );
    setSkillsHydrated(true);
  }, [techSkills, skillsHydrated]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      bio: techProfile?.bio ?? '',
      years_experience: techProfile?.years_experience ?? undefined,
      max_distance_km: techProfile?.max_distance_km ?? 20,
      phone: userProfile?.phone ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync({
      bio: data.bio || null,
      years_experience: data.years_experience || null,
      max_distance_km: data.max_distance_km || 20,
      is_available: isAvailable,
      phone: data.phone || undefined,
    });

    // Only persist skills once they have hydrated from the server; otherwise a
    // not-yet-loaded selector would submit [] and wipe existing skills.
    if (skillsHydrated) {
      await updateSkills.mutateAsync(selectedSkills);
    }

    toast({ title: 'تم تحديث الملف الشخصي', description: 'تم حفظ تغييراتك.' });
  };

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    try {
      await updateProfile.mutateAsync({ is_available: newVal });
      toast({
        title: newVal ? 'أنت متاح الآن' : 'أنت غير متاح الآن',
        description: newVal
          ? 'يمكن للعملاء تعيينك لطلبات جديدة.'
          : 'لن تصلك طلبات عمل جديدة.',
      });
    } catch {
      setIsAvailable(!newVal);
      toast({
        title: 'تعذّر تحديث الحالة',
        description: 'يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container flex flex-col items-center gap-4 py-16 text-center" dir="rtl">
        <AlertCircle className="h-12 w-12 text-destructive/70" />
        <div>
          <h1 className="text-xl font-semibold">تعذّر تحميل الملف الشخصي</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'حدث خطأ ما. يرجى المحاولة مرة أخرى.'}
          </p>
        </div>
        <Button onClick={() => void refetch()}>إعادة المحاولة</Button>
      </div>
    );
  }

  const statusKey = techProfile?.verification_status ?? 'unverified';
  const verificationBadge = {
    unverified: { label: 'غير موثّق', variant: 'secondary' as const },
    pending: { label: 'قيد المراجعة', variant: 'warning' as const },
    verified: { label: 'موثّق', variant: 'success' as const },
    rejected: { label: 'مرفوض', variant: 'destructive' as const },
  }[statusKey] ?? { label: 'غير معروف', variant: 'outline' as const };

  const needsSetup =
    !techProfile?.national_id ||
    !techProfile?.governorate ||
    !techProfile?.profile_photo_url ||
    !techProfile?.id_card_photo_url;

  const missingFields = techProfile
    ? getTechnicianProfileMissingFields(techProfile, techSkills?.length ?? 0)
    : [];

  if (needsSetup) {
    return (
      <div className="container py-16 text-center" dir="rtl">
        <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="mb-2 text-2xl font-bold">لم يكتمل إعداد ملفك</h1>
        <p className="mb-6 text-muted-foreground">
          أكمل إعداد ملفك الشخصي لتبدأ باستقبال الطلبات.
        </p>
        <Button asChild>
          <a href="/auth/register-technician?complete=1">إكمال التسجيل</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ملفي الشخصي</h1>
        <p className="mt-1 text-muted-foreground">أدر ملفك الشخصي ومهاراتك وحالة توفّرك.</p>
        {missingFields.includes('bio') && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            تم مسح نبذتك التعريفية. أضف نبذة قصيرة أدناه واحفظها لتبقى مؤهلاً لاستقبال الطلبات.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نبذة عنك</CardTitle>
              <CardDescription>معلوماتك المهنية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="bio">النبذة التعريفية</Label>
                <Textarea id="bio" className="min-h-[100px]" {...register('bio')} />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="years_experience">سنوات الخبرة</Label>
                  <Input id="years_experience" type="number" {...register('years_experience')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" type="tel" {...register('phone')} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="max_distance_km">نطاق الخدمة المفضّل (كم)</Label>
                <Input id="max_distance_km" type="number" {...register('max_distance_km')} />
                <p className="text-xs text-muted-foreground">
                  نطاق تفضيلي فقط — حالياً يظهر ملفك لجميع العملاء بغضّ النظر عن المسافة.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المهارات والخدمات</CardTitle>
              <CardDescription>اختر الخدمات التي تقدّمها وحدّد أسعارك</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillSelector selected={selectedSkills} onChange={setSelectedSkills} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full gap-2" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الحالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span id="availability-label" className="text-sm">
                    متاح للعمل
                  </span>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                  aria-labelledby="availability-label"
                  aria-label="متاح للعمل"
                />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">التوثيق</span>
                <Badge variant={verificationBadge.variant} className="ms-auto">
                  {verificationBadge.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">الطلبات المكتملة</span>
                </div>
                <span className="font-semibold">{techProfile?.completed_jobs ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">التقييم</span>
                </div>
                <span className="font-semibold">
                  {(techProfile?.total_ratings ?? 0) > 0
                    ? `${techProfile?.average_rating?.toFixed(1) ?? '0.0'} (${techProfile?.total_ratings ?? 0})`
                    : 'لا توجد تقييمات'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">تقييمات العملاء</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <RatingSummary
                  averageRating={techProfile?.average_rating ?? 0}
                  totalRatings={techProfile?.total_ratings ?? 0}
                  distribution={(() => {
                    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    reviews?.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
                    return dist;
                  })()}
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3 lg:col-span-2">
            {!reviews ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <Star className="h-8 w-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium">لا توجد تقييمات بعد</p>
                    <p className="text-xs text-muted-foreground">
                      ستظهر التقييمات هنا بعد أن يُكمل العملاء طلباتهم.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              reviews?.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.created_at}
                  customerName={review.customer?.full_name ?? null}
                  customerAvatar={review.customer?.avatar_url ?? null}
                />
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
