'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TechnicianMatchCardTechnician {
  id: string;
  bio: string | null;
  years_experience: number | null;
  average_rating: number;
  total_ratings: number;
  completed_jobs: number;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

interface TechnicianMatchCardProps {
  technician: TechnicianMatchCardTechnician;
  onAssign: (technicianId: string) => void;
  isAssigning: boolean;
}

export function TechnicianMatchCard({
  technician,
  onAssign,
  isAssigning,
}: TechnicianMatchCardProps) {
  const name = technician.profile.full_name ?? 'فني';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={technician.profile.avatar_url ?? undefined} alt={name} />
        <AvatarFallback>{initials || 'ف'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-text-primary">{name}</p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {technician.average_rating.toFixed(1)} ({technician.total_ratings})
          </span>
        </div>
        {technician.years_experience != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            {technician.years_experience} سنوات خبرة · {technician.completed_jobs} مهمة
          </p>
        )}
        {technician.bio && (
          <p className={cn('mt-2 line-clamp-2 text-sm text-text-secondary')}>{technician.bio}</p>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0"
        disabled={isAssigning}
        onClick={() => onAssign(technician.id)}
      >
        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تعيين'}
      </Button>
    </div>
  );
}
