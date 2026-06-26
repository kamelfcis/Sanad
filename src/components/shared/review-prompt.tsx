'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface ReviewPromptProps {
  bookingId: string;
}

export function ReviewPrompt({ bookingId }: ReviewPromptProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            How was your experience?
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Your feedback helps other customers and technicians.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/customer/bookings/${bookingId}/review`}>
            <MessageSquare className="mr-1 h-4 w-4" />
            Review
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
