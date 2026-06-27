'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentSettings, useUpdatePaymentSettings } from '@/hooks/use-payments';
import { useAdminSiteSettings, useUpdateSiteSettings } from '@/hooks/use-site-settings';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Save } from 'lucide-react';
import type { PaymentSettings } from '@/types/payments';
import type { SiteSettings } from '@/types/site-settings';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';
import {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  type SiteCurrency,
} from '@/lib/currency/constants';

function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const { t, dir } = useAdminT();
  const [instapayNumber, setInstapayNumber] = useState(settings.instapay_number);
  const [instapayName, setInstapayName] = useState(settings.instapay_name);
  const [vodafoneNumber, setVodafoneNumber] = useState(settings.vodafone_cash_number);
  const [instructions, setInstructions] = useState(settings.instructions);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const updateSettings = useUpdatePaymentSettings();
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

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
        <Label htmlFor="instapay-name">{t('paymentSettings.instapayName')}</Label>
        <Input id="instapay-name" value={instapayName} onChange={(e) => setInstapayName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instapay-number">{t('paymentSettings.instapayNumber')}</Label>
        <Input id="instapay-number" value={instapayNumber} onChange={(e) => setInstapayNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vodafone-number">{t('paymentSettings.vodafoneNumber')}</Label>
        <Input id="vodafone-number" value={vodafoneNumber} onChange={(e) => setVodafoneNumber(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">{t('paymentSettings.instructions')}</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          dir="auto"
        />
      </div>
      <Button onClick={handlePaymentSave} disabled={updateSettings.isPending}>
        <Save className={cn('h-4 w-4', iconMargin)} />
        {paymentSaved
          ? t('paymentSettings.saved')
          : updateSettings.isPending
            ? t('paymentSettings.saving')
            : t('paymentSettings.save')}
      </Button>
    </>
  );
}

function CurrencySettingsForm({ settings }: { settings: SiteSettings }) {
  const { t, locale, dir } = useAdminT();
  const [currency, setCurrency] = useState<SiteCurrency>(settings.currency);
  const [saved, setSaved] = useState(false);
  const updateSettings = useUpdateSiteSettings();
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const handleSave = () => {
    updateSettings.mutate(
      { currency },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  return (
    <>
      <p className="text-sm text-muted-foreground">{t('currencySettings.description')}</p>
      <div className="space-y-2">
        <Label htmlFor="currency">{t('currencySettings.label')}</Label>
        <Select value={currency} onValueChange={(value) => setCurrency(value as SiteCurrency)}>
          <SelectTrigger id="currency" className="border-[#E2E8F0] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>
                {CURRENCY_LABELS[code][locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={updateSettings.isPending || currency === settings.currency}>
        <Save className={cn('h-4 w-4', iconMargin)} />
        {saved
          ? t('currencySettings.saved')
          : updateSettings.isPending
            ? t('currencySettings.saving')
            : t('currencySettings.save')}
      </Button>
    </>
  );
}

export default function AdminSettingsPage() {
  const { t, dir } = useAdminT();
  const [platformName, setPlatformName] = useState('Sanad');
  const [supportEmail, setSupportEmail] = useState('support@sanad.sa');
  const [saved, setSaved] = useState(false);
  const iconMargin = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const { data: paymentSettings, isLoading: paymentLoading } = usePaymentSettings();
  const { data: siteSettings, isLoading: siteLoading } = useAdminSiteSettings();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{t('settings.title')}</h1>
        <p className="mt-1 text-[#64748B]">{t('settings.subtitle')}</p>
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Coins className="h-4 w-4 text-[#FF6B00]" />
              {t('currencySettings.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {siteLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : siteSettings ? (
              <CurrencySettingsForm key={siteSettings.updated_at} settings={siteSettings} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-medium">{t('settings.general')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.platformName')}</Label>
              <Input id="name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.supportEmail')}</Label>
              <Input id="email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <Separator />
            <Button onClick={handleSave}>
              <Save className={cn('h-4 w-4', iconMargin)} /> {saved ? t('settings.saved') : t('settings.save')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-medium">{t('paymentSettings.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {paymentLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : paymentSettings ? (
              <PaymentSettingsForm key={paymentSettings.updated_at} settings={paymentSettings} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-medium">{t('settings.about')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('settings.aboutText')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
