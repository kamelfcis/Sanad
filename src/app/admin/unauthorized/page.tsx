'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="mt-2 text-muted-foreground">
          You do not have permission to access this area. Only administrators can view this page.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
