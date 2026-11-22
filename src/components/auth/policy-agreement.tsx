'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <div className="pr-6 text-xs">
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          قراءة الشروط كاملة في صفحة مستقلة
        </Link>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle className="text-right">{LIABILITY_POLICY_TITLE}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pl-1 text-sm leading-relaxed text-text-secondary">
            {LIABILITY_POLICY_PARAGRAPHS.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            فتح صفحة الشروط كاملة
          </Link>
          <Button
            type="button"
            className="w-full bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md hover:brightness-105"
            onClick={() => {
              onCheckedChange(true);
              setOpen(false);
            }}
          >
            قرأت وأوافق
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
