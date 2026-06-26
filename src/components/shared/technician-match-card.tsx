'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Wrench } from 'lucide-react';

interface TechnicianMatchCardProps {
  technician: {
    id: string;
    profile: {
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
      phone: string | null;
    };
    verification_status: string;
    is_available: boolean;
    average_rating: number;
    completed_jobs: number;
    skills_count: number;
    years_experience: number | null;
    max_distance_km: number | null;
  };
  onAssign: (technicianId: string) => void;
  isAssigning?: boolean;
}

export function TechnicianMatchCard({ technician, onAssign, isAssigning }: TechnicianMatchCardProps) {
  const initials = (technician.profile.full_name ?? technician.profile.email ?? '??')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/50">
      <Avatar className="h-12 w-12">
        <AvatarImage src={technician.profile.avatar_url ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {technician.profile.full_name ?? 'Unnamed Technician'}
          </p>
          {technician.verification_status === 'verified' && (
            <Badge variant="success" className="text-[10px]">Verified</Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {technician.average_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {technician.average_rating.toFixed(1)} ({technician.completed_jobs})
            </span>
          )}
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {technician.skills_count} skills
          </span>
          {technician.years_experience && (
            <span>{technician.years_experience} yrs exp</span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => onAssign(technician.id)}
        disabled={isAssigning}
      >
        {isAssigning ? 'Assigning...' : 'Assign'}
      </Button>
    </div>
  );
}
