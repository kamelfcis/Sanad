'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AssignmentStatus } from '@/components/shared/assignment-status';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface JobActionBarProps {
  assignmentId: string;
  status: string;
  createdAt: string;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function JobActionBar({ status, createdAt, onAccept, onReject }: JobActionBarProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (status !== 'pending') return;

    const created = new Date(createdAt).getTime();
    const deadline = created + 15 * 60 * 1000; // 15 minutes

    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, createdAt]);

  if (status !== 'pending' || expired) {
    return (
      <div className="flex items-center gap-3">
        <AssignmentStatus status={expired ? 'cancelled' : status} />
        {status === 'accepted' && (
          <p className="text-xs text-muted-foreground">لقد قبلت هذا الطلب.</p>
        )}
        {status === 'rejected' && (
          <p className="text-xs text-muted-foreground">لقد رفضت هذا الطلب.</p>
        )}
        {expired && <p className="text-xs text-destructive">انتهى وقت الاستجابة.</p>}
      </div>
    );
  }

  const minutes = timeLeft ? Math.floor(timeLeft / 60000) : 0;
  const seconds = timeLeft ? Math.floor((timeLeft % 60000) / 1000) : 0;
  const isUrgent = timeLeft !== null && timeLeft < 120000; // less than 2 minutes

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <AssignmentStatus status={status} />
        <div className={cn('flex items-center gap-1 text-xs', isUrgent ? 'text-destructive' : 'text-muted-foreground')}>
          <Clock className={cn('h-3 w-3', isUrgent && 'animate-pulse')} />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          className="h-11 flex-1 gap-2 rounded-xl font-bold"
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          قبول
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1 gap-2 rounded-xl font-bold"
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          رفض
        </Button>
      </div>
    </div>
  );
}
