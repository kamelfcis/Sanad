'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from '@/lib/constants/terms';

interface PolicyAgreementProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  error?: string;
}

export function PolicyAgreement({ checked, onCheckedChange, error }: PolicyAgreementProps) {
  const [open, setOpen] = useState(false);
  const [pendingAgreement, setPendingAgreement] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const content = termsContentRef.current;
    if (!content) return;

    const updateReadProgress = () => {
      if (content.scrollHeight <= content.clientHeight + 8) {
        setReachedEnd(true);
      }
    };

    updateReadProgress();
    const frame = window.requestAnimationFrame(updateReadProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const openTerms = () => {
    setPendingAgreement(checked);
    setReachedEnd(false);
    setOpen(true);
  };

  const handleTermsScroll = () => {
    const content = termsContentRef.current;
    if (!content) return;
    if (content.scrollTop + content.clientHeight >= content.scrollHeight - 12) {
      setReachedEnd(true);
    }
  };

  const confirmAgreement = () => {
    if (!reachedEnd || !pendingAgreement) return;
    onCheckedChange(true);
    setOpen(false);
  };

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {checked ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {checked ? 'تمت الموافقة على الشروط والأحكام' : 'راجع الشروط والأحكام قبل إنشاء حسابك'}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-text-secondary">
            {checked ? 'يمكنك فتحها ومراجعتها مرة أخرى في أي وقت.' : 'اقرأ البنود ثم سجّل موافقتك في نهاية النص.'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openTerms}>
          {checked ? 'مراجعة' : 'قراءة'}
        </Button>
      </div>

      <div className="pr-1 text-xs">
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          فتح صفحة الشروط كاملة
        </Link>
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 text-right">
          <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-l from-primary/10 via-card to-card px-5 py-5 text-right sm:px-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-text-primary sm:text-2xl">
                  الشروط والأحكام
                </DialogTitle>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  يرجى مراجعة البنود التالية. ستجد خيار الموافقة بعد قراءة النص حتى نهايته.
                </p>
                <p className="mt-1 text-xs text-text-muted">آخر تحديث: {TERMS_LAST_UPDATED}</p>
              </div>
            </div>
          </DialogHeader>

          <div
            ref={termsContentRef}
            onScroll={handleTermsScroll}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-surface/40 px-4 py-4 sm:px-7 sm:py-5"
            tabIndex={0}
            aria-label="نص الشروط والأحكام"
          >
            {TERMS_SECTIONS.map((section, index) => (
              <section
                key={section.title}
                aria-labelledby={`agreement-section-${index}`}
                className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`agreement-section-${index}`} className="text-base font-bold leading-7 text-text-primary sm:text-lg">
                      {section.title}
                    </h3>
                    {section.intro && <p className="mt-2 leading-7 text-text-secondary">{section.intro}</p>}
                    {section.bullets && (
                      <ul className="mt-2 list-disc space-y-1.5 pe-5 leading-7 text-text-secondary marker:text-primary">
                        {section.bullets.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph} className="mt-3 leading-7 text-text-secondary">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="policy-agreement-final"
                  checked={pendingAgreement}
                  disabled={!reachedEnd}
                  onCheckedChange={(value) => setPendingAgreement(value === true)}
                  className="mt-1"
                />
                <label htmlFor="policy-agreement-final" className="cursor-pointer text-sm font-semibold leading-7 text-text-primary">
                  قرأت الشروط والأحكام وأوافق على الالتزام بها.
                </label>
              </div>
              {!reachedEnd && (
                <p className="mt-2 pr-7 text-xs leading-5 text-text-secondary">
                  مرّر لأسفل حتى نهاية البنود لتمكين خيار الموافقة.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 text-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:text-right"
            >
              عرض صفحة الشروط كاملة
            </Link>
            <Button
              type="button"
              disabled={!reachedEnd || !pendingAgreement}
              className="bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={confirmAgreement}
            >
              قرأت وأوافق على الشروط والأحكام
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
