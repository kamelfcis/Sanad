'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface JobActionBarProps {
  assignmentId: string;
  status: string;
  createdAt?: string;
  onAccept: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}

export function JobActionBar({ status, onAccept, onReject }: JobActionBarProps) {
  if (status !== 'pending') return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" className="h-11 flex-1 gap-2 rounded-xl font-bold" onClick={() => void onAccept()}>
        <Check className="h-4 w-4" />
        قبول الطلب
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 flex-1 gap-2 rounded-xl font-bold"
        onClick={() => void onReject()}
      >
        <X className="h-4 w-4" />
        رفض الطلب
      </Button>
    </div>
  );
}
