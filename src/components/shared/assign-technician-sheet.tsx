'use client';

import { useState } from 'react';
import { useAdminTechnicians, useAdminAssignTechnician } from '@/hooks/use-technician';
import { TechnicianMatchCard } from '@/components/shared/technician-match-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Search, User } from 'lucide-react';

interface AssignTechnicianSheetProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTechnicianSheet({ bookingId, open, onOpenChange }: AssignTechnicianSheetProps) {
  const { data: technicians, isLoading } = useAdminTechnicians();
  const assignMutation = useAdminAssignTechnician();
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const filteredTechnicians = technicians?.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = t.profile.full_name?.toLowerCase() ?? '';
    const email = t.profile.email?.toLowerCase() ?? '';
    return name.includes(q) || email.includes(q);
  });

  const handleAssign = async (technicianId: string) => {
    setAssigningId(technicianId);
    try {
      await assignMutation.mutateAsync({ bookingId, technicianId });
      onOpenChange(false);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Assign Technician</SheetTitle>
          <SheetDescription>
            Choose a technician to assign to this booking. The booking will be marked as accepted.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTechnicians?.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No technicians found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search term.' : 'No verified technicians available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTechnicians?.map((tech) => (
                <TechnicianMatchCard
                  key={tech.id}
                  technician={tech}
                  onAssign={handleAssign}
                  isAssigning={assigningId === tech.id}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
