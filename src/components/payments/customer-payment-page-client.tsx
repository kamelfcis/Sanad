'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { useBookingPayment, useSubmitPayment } from '@/hooks/use-payments';
import { uploadFileViaApi } from '@/lib/storage/client-upload';
import { MAX_PAYMENT_UPLOAD_SIZE_BYTES } from '@/lib/validations/payments';
import type { PaymentMethod } from '@/types/payments';
import { ArrowLeft, Copy, Check, Upload, Smartphone, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useFormatMoney } from '@/hooks/use-site-settings';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
      {copied ? 'Copied' : `Copy ${label}`}
    </Button>
  );
}

export function CustomerPaymentPageClient({ bookingId }: { bookingId: string }) {
  const { data, isLoading, error } = useBookingPayment(bookingId);
  const submit = useSubmitPayment();
  const { formatMoney } = useFormatMoney();

  const [method, setMethod] = useState<PaymentMethod>('instapay');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Unable to load payment</h1>
        <p className="mb-6 text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button asChild>
          <Link href={`/customer/bookings/${bookingId}`}>Back to booking</Link>
        </Button>
      </div>
    );
  }

  const { payment, settings, booking } = data;
  const amount = Number(booking.price_quote ?? payment?.amount ?? 0);
  const canSubmit = !payment || payment.status === 'rejected';
  const isPending = payment?.status === 'pending';
  const isApproved = payment?.status === 'approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!file) {
      setFormError('Please upload a payment screenshot.');
      return;
    }

    if (file.size > MAX_PAYMENT_UPLOAD_SIZE_BYTES) {
      setFormError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const screenshotUrl = await uploadFileViaApi(file, 'payment');
      await submit.mutateAsync({
        bookingId,
        payment_method: method,
        screenshot_url: screenshotUrl,
        amount: amount > 0 ? amount : undefined,
      });
      setFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/customer/bookings/${bookingId}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to booking
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="auto">
            {booking.services?.name_ar ?? 'Service booking'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span dir="auto">{booking.services?.name_ar ?? '—'}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Amount due</span>
              <span>{amount > 0 ? formatMoney(amount) : 'Contact support'}</span>
            </div>
          </CardContent>
        </Card>

        {payment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentStatusBadge status={payment.status} rejectionReason={payment.rejection_reason} />
              {payment.screenshot_url && (
                <a
                  href={payment.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-primary underline"
                >
                  View submitted screenshot
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              Your payment is under review. We will notify you once it is verified.
            </CardContent>
          </Card>
        )}

        {isApproved && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-sm text-green-800">
              Payment confirmed. Thank you!
            </CardContent>
          </Card>
        )}

        {canSubmit && amount > 0 && settings && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {([
                  { id: 'instapay' as const, label: 'InstaPay', icon: CreditCard },
                  { id: 'vodafone_cash' as const, label: 'Vodafone Cash', icon: Smartphone },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                      method === opt.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
                    )}
                  >
                    <opt.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {method === 'instapay' ? (
                  <>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Account name</p>
                        <p className="font-medium">{settings.instapay_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">InstaPay number</p>
                        <p className="font-mono font-medium">{settings.instapay_number}</p>
                      </div>
                      <CopyButton value={settings.instapay_number} label="number" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Vodafone Cash number</p>
                      <p className="font-mono font-medium">{settings.vodafone_cash_number}</p>
                    </div>
                    <CopyButton value={settings.vodafone_cash_number} label="number" />
                  </div>
                )}
                {settings.instructions && (
                  <p className="text-sm text-muted-foreground" dir="auto">{settings.instructions}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Upload Screenshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="screenshot" className="sr-only">Payment screenshot</Label>
                <input
                  id="screenshot"
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setUploadError(null);
                    setFormError(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or PDF — max 5MB
                </p>
                {(formError || uploadError) && (
                  <p className="text-sm text-destructive">{formError ?? uploadError}</p>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={uploading || submit.isPending || !file}
            >
              <Upload className="mr-1 h-4 w-4" />
              {uploading || submit.isPending ? 'Submitting…' : payment?.status === 'rejected' ? 'Resubmit Payment' : 'Submit Payment'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
