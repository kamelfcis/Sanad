'use client';

import { useState } from 'react';
import { ScaleIcon, ShieldCheckIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LIABILITY_POLICY_TITLE, LIABILITY_POLICY_PARAGRAPHS } from '@/lib/constants/policy';

interface PolicyAgreementProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  error?: string;
}

export function PolicyAgreement({ checked, onCheckedChange, error }: PolicyAgreementProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5" dir="rtl">
      <div className="flex items-start gap-2">
        <Checkbox
          id="policy-agreement"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <label htmlFor="policy-agreement" className="text-sm leading-relaxed text-text-secondary">
          أوافق على{' '}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-medium text-primary hover:underline"
          >
            {LIABILITY_POLICY_TITLE}
          </button>{' '}
          وسياسة الاستخدام
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-right text-lg font-bold">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-sm">
                <ScaleIcon className="h-5 w-5" />
              </span>
              {LIABILITY_POLICY_TITLE}
            </DialogTitle>
          </DialogHeader>
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto pl-1">
            {LIABILITY_POLICY_PARAGRAPHS.map((paragraph, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] to-transparent p-3.5 shadow-sm"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white shadow-sm">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-relaxed text-text-primary">
                  {paragraph}
                </p>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="w-full gap-2 bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md hover:brightness-105"
            onClick={() => {
              onCheckedChange(true);
              setOpen(false);
            }}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            قرأت وأوافق
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
