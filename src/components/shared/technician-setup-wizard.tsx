'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { SkillSelector } from '@/components/shared/skill-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { uploadFileViaApi } from '@/lib/storage/client-upload';

const steps = [
  { id: 'profile', label: 'Profile' },
  { id: 'skills', label: 'Skills' },
  { id: 'verification', label: 'Verification' },
];

const profileSchema = z.object({
  bio: z.string().min(20, 'Please write at least 20 characters about yourself').max(500),
  years_experience: z.coerce.number().min(0).max(70),
  phone: z.string().min(7, 'Please enter a valid phone number'),
});

type ProfileData = z.infer<typeof profileSchema>;

interface SelectedSkill {
  service_id: string;
  price_override: number | null;
}

export function TechnicianSetupWizard() {
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationFiles, setVerificationFiles] = useState<string[]>([]);
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  const handleProfileSubmit = async (data: ProfileData) => {
    setIsSubmitting(true);

    // Update phone in profiles
    await supabase.from('profiles').update({ phone: data.phone }).eq('id', profile?.id);

    // Create technician profile
    const { error } = await supabase.from('technician_profiles').upsert({
      id: profile?.id,
      bio: data.bio,
      years_experience: data.years_experience,
      verification_status: 'unverified',
      is_available: true,
    });

    if (error) {
      toast({ title: 'Failed to save profile', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    // Update profile store
    if (profile) {
      setProfile({ ...profile, phone: data.phone });
    }

    toast({ title: 'Profile saved', description: 'Now let\'s add your skills.' });
    setIsSubmitting(false);
    setStep(1);
  };

  const handleSkillsSubmit = async () => {
    if (skills.length === 0) {
      toast({ title: 'Select at least one skill', description: 'Please select the services you offer.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const res = await fetch('/api/technician/skills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: 'Failed to save skills', description: err.error, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    toast({ title: 'Skills saved!' });
    setIsSubmitting(false);
    setStep(2);
  };

  const handleVerificationSubmit = async () => {
    if (verificationFiles.length === 0) {
      toast({
        title: 'Upload required',
        description: 'Please upload at least one identification document.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('technician_profiles')
      .update({
        verification_status: 'pending',
        verification_docs: verificationFiles,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile?.id);

    if (error) {
      toast({ title: 'Failed to submit verification', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Verification submitted!',
      description: 'Your documents are being reviewed. You can start browsing jobs.',
    });

    setIsSubmitting(false);
    router.push('/technician/jobs');
    router.refresh();
  };

  const handleDocUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const publicUrl = await uploadFileViaApi(file);
        setVerificationFiles((prev) => [...prev, publicUrl]);
        toast({ title: 'Document uploaded' });
      } catch {
        toast({ title: 'Upload failed', description: 'File could not be uploaded.', variant: 'destructive' });
      }
    };
    input.click();
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Steps Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    i < step && 'bg-primary text-primary-foreground',
                    i === step && 'border-2 border-primary bg-primary/10 text-primary',
                    i > step && 'border-2 border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {i < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'mt-1 text-xs',
                    i <= step ? 'font-medium text-primary' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 w-16 sm:w-24',
                    i < step ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Profile */}
      {step === 0 && (
        <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">About You</h2>
            <p className="text-sm text-muted-foreground">
              Tell customers about your experience and expertise.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="I have been working as a professional technician for over 10 years..."
              className="min-h-[120px]"
              {...register('bio')}
            />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="years_experience">Years of experience</Label>
              <Input
                id="years_experience"
                type="number"
                min={0}
                max={70}
                placeholder="5"
                {...register('years_experience')}
              />
              {errors.years_experience && (
                <p className="text-xs text-destructive">{errors.years_experience.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+966 5X XXX XXXX"
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Skills
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Step 1: Skills */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Your Skills</h2>
            <p className="text-sm text-muted-foreground">
              Select the services you offer. You can set your own price for each.
            </p>
          </div>

          <SkillSelector selected={skills} onChange={setSkills} />

          {skills.length > 0 && (
            <div className="rounded-lg bg-primary/5 p-3 text-sm">
              <strong>{skills.length}</strong> service{skills.length !== 1 ? 's' : ''} selected
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1" onClick={handleSkillsSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Verification */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Verification</h2>
            <p className="text-sm text-muted-foreground">
              Upload your ID or license to verify your identity. This helps build trust with
              customers.
            </p>
          </div>

          <div className="space-y-3">
            <div
              onClick={handleDocUpload}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Upload document</p>
                <p className="text-xs text-muted-foreground">PDF, PNG, or JPG — Max 10MB</p>
              </div>
            </div>

            {verificationFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded documents ({verificationFiles.length})</p>
                {verificationFiles.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="truncate text-muted-foreground">{url.split('/').pop()}</span>
                    <button
                      type="button"
                      onClick={() => setVerificationFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-auto text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Your documents will be reviewed by our team. You can still browse available jobs while
            waiting for verification.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1" onClick={handleVerificationSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
              <Check className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
