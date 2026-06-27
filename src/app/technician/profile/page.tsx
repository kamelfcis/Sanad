'use client';

import { useState } from 'react';
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
import { Loader2, User, Star, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const profileSchema = z.object({
  bio: z.string().min(10).max(500).optional().or(z.literal('')),
  years_experience: z.coerce.number().min(0).max(70).optional(),
  max_distance_km: z.coerce.number().min(1).max(200).optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function TechnicianProfilePage() {
  const { data: techProfile, isLoading } = useTechnicianProfile();
  const { data: techSkills } = useTechnicianSkills();
  const { data: reviews } = useTechnicianReviews(techProfile?.id ?? '');
  const updateProfile = useUpdateTechnicianProfile();
  const updateSkills = useUpdateTechnicianSkills();
  const { profile: userProfile } = useAuthStore();

  const [isAvailable, setIsAvailable] = useState(techProfile?.is_available ?? true);
  const [selectedSkills, setSelectedSkills] = useState(
    techSkills?.map((s) => ({
      service_id: s.service_id,
      price_override: s.price_override,
    })) ?? [],
  );

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

    await updateSkills.mutateAsync(selectedSkills);

    toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
  };

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    try {
      await updateProfile.mutateAsync({ is_available: newVal });
      toast({
        title: newVal ? 'You are now available' : 'You are now offline',
        description: newVal
          ? 'Customers can assign you to new jobs.'
          : 'You will not receive new job requests.',
      });
    } catch {
      setIsAvailable(!newVal);
      toast({
        title: 'Could not update availability',
        description: 'Please try again.',
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

  const statusKey = techProfile?.verification_status ?? 'unverified';
  const verificationBadge = {
    unverified: { label: 'Unverified', variant: 'secondary' as const },
    pending: { label: 'Pending Review', variant: 'warning' as const },
    verified: { label: 'Verified', variant: 'success' as const },
    rejected: { label: 'Rejected', variant: 'destructive' as const },
  }[statusKey] ?? { label: 'Unknown', variant: 'outline' as const };

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
      <div className="container py-16 text-center">
        <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="mb-2 text-2xl font-bold">Profile not set up</h1>
        <p className="mb-6 text-muted-foreground">
          Complete your profile setup to start receiving jobs.
        </p>
        <Button asChild>
          <a href="/auth/register-technician?complete=1">Complete registration</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, skills, and availability.</p>
        {missingFields.includes('bio') && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your bio was cleared. Add a short bio below and save to stay eligible for jobs.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
              <CardDescription>Your professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" className="min-h-[100px]" {...register('bio')} />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="years_experience">Years of experience</Label>
                  <Input id="years_experience" type="number" {...register('years_experience')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" {...register('phone')} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="max_distance_km">Max service distance (km)</Label>
                <Input id="max_distance_km" type="number" {...register('max_distance_km')} />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills & Services</CardTitle>
              <CardDescription>Select the services you offer and set your prices</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillSelector selected={selectedSkills} onChange={setSelectedSkills} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Available for jobs</span>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Verification</span>
                <Badge variant={verificationBadge.variant} className="ml-auto">
                  {verificationBadge.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Completed jobs</span>
                </div>
                <span className="font-semibold">{techProfile?.completed_jobs ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Rating</span>
                </div>
                <span className="font-semibold">
                  {(techProfile?.total_ratings ?? 0) > 0
                    ? `${techProfile?.average_rating?.toFixed(1) ?? '0.0'} (${techProfile?.total_ratings ?? 0})`
                    : 'No ratings'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Customer Reviews</h2>
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
                    <p className="text-sm font-medium">No reviews yet</p>
                    <p className="text-xs text-muted-foreground">
                      Reviews will appear here after customers complete bookings.
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
