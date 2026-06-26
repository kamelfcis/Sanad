'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentSettings, useUpdatePaymentSettings } from '@/hooks/use-payments';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';
import type { PaymentSettings } from '@/types/payments';

function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const [instapayNumber, setInstapayNumber] = useState(settings.instapay_number);
  const [instapayName, setInstapayName] = useState(settings.instapay_name);
  const [vodafoneNumber, setVodafoneNumber] = useState(settings.vodafone_cash_number);
  const [instructions, setInstructions] = useState(settings.instructions);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const updateSettings = useUpdatePaymentSettings();

  const handlePaymentSave = () => {
    updateSettings.mutate(
      {
        instapay_number: instapayNumber,
        instapay_name: instapayName,
        vodafone_cash_number: vodafoneNumber,
        instructions,
      },
      {
        onSuccess: () => {
          setPaymentSaved(true);
          setTimeout(() => setPaymentSaved(false), 2000);
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="instapay-name">InstaPay Account Name</Label>
        <Input id="instapay-name" value={instapayName} onChange={(e) => setInstapayName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instapay-number">InstaPay Number</Label>
        <Input id="instapay-number" value={instapayNumber} onChange={(e) => setInstapayNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vodafone-number">Vodafone Cash Number</Label>
        <Input id="vodafone-number" value={vodafoneNumber} onChange={(e) => setVodafoneNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Payment Instructions</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          dir="auto"
        />
      </div>
      <Button onClick={handlePaymentSave} disabled={updateSettings.isPending}>
        <Save className="mr-1 h-4 w-4" />
        {paymentSaved ? 'Saved!' : updateSettings.isPending ? 'Saving…' : 'Save Payment Settings'}
      </Button>
    </>
  );
}

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('Sanad');
  const [supportEmail, setSupportEmail] = useState('support@sanad.sa');
  const [saved, setSaved] = useState(false);

  const { data: paymentSettings, isLoading: settingsLoading } = usePaymentSettings();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Platform configuration.</p>
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Platform Name</Label>
              <Input id="name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Support Email</Label>
              <Input id="email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <Separator />
            <Button onClick={handleSave}>
              <Save className="mr-1 h-4 w-4" /> {saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Manual Payment Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : paymentSettings ? (
              <PaymentSettingsForm key={paymentSettings.updated_at} settings={paymentSettings} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">About</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sanad v1.0.0 — A home services marketplace platform built with Next.js, Supabase, and TailwindCSS.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
