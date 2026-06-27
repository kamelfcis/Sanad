'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentSettings, useUpdatePaymentSettings } from '@/hooks/use-payments';
import { useAdminSiteSettings, useUpdateSiteSettings } from '@/hooks/use-site-settings';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminEntityCard,
  AdminEntityCardActions,
  AdminPageHeader,
} from '@/components/admin/admin-list-chrome';
import {
  Banknote,
  Building2,
  Coins,
  Info,
  Save,
  Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentSettings } from '@/types/payments';
import type { SiteSettings } from '@/types/site-settings';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';
import {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  type SiteCurrency,
} from '@/lib/currency/constants';

type SettingsCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: 'default' | 'accent';
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function SettingsCard({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
  children,
  footer,
}: SettingsCardProps) {
  if (variant === 'accent') {
    return (
      <article
        className={cn(
          'relative flex flex-col overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-amber-50/90 to-orange-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-orange-300/80 hover:shadow-[0_8px_24px_rgba(255,107,0,0.12)]',
          className,
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
          <header className="mb-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A34] shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/20">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-orange-900/55">{description}</p>
                ) : null}
              </div>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
        {footer ? (
          <footer className="border-t border-orange-200/50 bg-white/40 px-5 py-4 sm:px-6">{footer}</footer>
        ) : null}
      </article>
    );
  }

  return (
    <AdminEntityCard className={cn('h-full', className)}>
      <header className="mb-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B00]/10">
            <Icon className="h-5 w-5 text-[#FF6B00]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? (
        <AdminEntityCardActions className="mt-auto border-zinc-100">{footer}</AdminEntityCardActions>
      ) : null}
    </AdminEntityCard>
  );
}

function SaveButton({
  onClick,
  disabled,
  isPending,
  saved,
  savingLabel,
  savedLabel,
  saveLabel,
  dir,
}: {
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
  saved: boolean;
  savingLabel: string;
  savedLabel: string;
  saveLabel: string;
  dir: 'ltr' | 'rtl';
}) {
  const iconMargin = dir === 'ltr' ? 'mr-1.5' : 'ml-1.5';
  const label = saved ? savedLabel : isPending ? savingLabel : saveLabel;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A34] px-5 shadow-sm shadow-orange-500/20 hover:from-[#E86200] hover:to-[#FF7A24]"
    >
      <Save className={cn('h-4 w-4', iconMargin)} />
      {label}
    </Button>
  );
}

function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const { t, dir } = useAdminT();
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
    <SettingsCard
      icon={Banknote}
      title={t('paymentSettings.title')}
      description={t('paymentSettings.description')}
      className="md:col-span-2 xl:col-span-3"
      footer={
        <SaveButton
          onClick={handlePaymentSave}
          disabled={updateSettings.isPending}
          isPending={updateSettings.isPending}
          saved={paymentSaved}
          savingLabel={t('paymentSettings.saving')}
          savedLabel={t('paymentSettings.saved')}
          saveLabel={t('paymentSettings.save')}
          dir={dir}
        />
      }
    >
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instapay-name">{t('paymentSettings.instapayName')}</Label>
          <Input
            id="instapay-name"
            value={instapayName}
            onChange={(e) => setInstapayName(e.target.value)}
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instapay-number">{t('paymentSettings.instapayNumber')}</Label>
          <Input
            id="instapay-number"
            value={instapayNumber}
            onChange={(e) => setInstapayNumber(e.target.value)}
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vodafone-number">{t('paymentSettings.vodafoneNumber')}</Label>
          <Input
            id="vodafone-number"
            value={vodafoneNumber}
            onChange={(e) => setVodafoneNumber(e.target.value)}
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
            dir="ltr"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="instructions">{t('paymentSettings.instructions')}</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            dir="auto"
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
          />
        </div>
      </div>
    </SettingsCard>
  );
}

function CurrencySettingsForm({ settings }: { settings: SiteSettings }) {
  const { t, locale, dir } = useAdminT();
  const [currency, setCurrency] = useState<SiteCurrency>(settings.currency);
  const [saved, setSaved] = useState(false);
  const updateSettings = useUpdateSiteSettings();

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
    <SettingsCard
      icon={Coins}
      title={t('currencySettings.title')}
      description={t('currencySettings.description')}
      variant="accent"
      footer={
        <SaveButton
          onClick={handleSave}
          disabled={updateSettings.isPending || currency === settings.currency}
          isPending={updateSettings.isPending}
          saved={saved}
          savingLabel={t('currencySettings.saving')}
          savedLabel={t('currencySettings.saved')}
          saveLabel={t('currencySettings.save')}
          dir={dir}
        />
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-orange-900/70">{t('currencySettings.label')}</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('currencySettings.label')}>
            {SUPPORTED_CURRENCIES.map((code) => {
              const selected = currency === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCurrency(code)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                    selected
                      ? 'border-[#FF6B00] bg-[#FF6B00] text-white shadow-sm shadow-orange-500/25'
                      : 'border-orange-200/80 bg-white/80 text-orange-900/70 hover:border-[#FF6B00]/50 hover:bg-white',
                  )}
                >
                  <span className="font-semibold">{code}</span>
                  <span className={cn('hidden text-xs sm:inline', selected ? 'text-white/90' : 'text-orange-800/50')}>
                    {CURRENCY_LABELS[code][locale].replace(` (${code})`, '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function GeneralSettingsForm() {
  const { t, dir } = useAdminT();
  const [platformName, setPlatformName] = useState('Sanad');
  const [supportEmail, setSupportEmail] = useState('support@sanad.sa');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SettingsCard
      icon={Settings2}
      title={t('settings.general')}
      description={t('settings.generalDescription')}
      footer={
        <SaveButton
          onClick={handleSave}
          saved={saved}
          savingLabel=""
          savedLabel={t('settings.saved')}
          saveLabel={t('settings.save')}
          dir={dir}
        />
      }
    >
      <div className="grid flex-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('settings.platformName')}</Label>
          <Input
            id="name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('settings.supportEmail')}</Label>
          <Input
            id="email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="border-zinc-200/80 bg-white shadow-sm focus-visible:ring-[#FF6B00]/30"
            dir="ltr"
          />
        </div>
      </div>
    </SettingsCard>
  );
}

function AboutCard() {
  const { t } = useAdminT();

  return (
    <SettingsCard icon={Info} title={t('settings.about')} variant="default">
      <div className="flex flex-1 flex-col justify-center rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#FF6B00]" />
          <span className="text-sm font-semibold text-zinc-900">Sanad</span>
          <span className="rounded-full bg-[#FF6B00]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FF6B00]">
            v1.0.0
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-500">{t('settings.aboutText')}</p>
      </div>
    </SettingsCard>
  );
}

export default function AdminSettingsPage() {
  const { t } = useAdminT();

  const { data: paymentSettings, isLoading: paymentLoading } = usePaymentSettings();
  const { data: siteSettings, isLoading: siteLoading } = useAdminSiteSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AdminPageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        {siteLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : siteSettings ? (
          <CurrencySettingsForm key={siteSettings.updated_at} settings={siteSettings} />
        ) : null}

        <GeneralSettingsForm />

        <AboutCard />

        {paymentLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl md:col-span-2 xl:col-span-3" aria-hidden />
        ) : paymentSettings ? (
          <PaymentSettingsForm key={paymentSettings.updated_at} settings={paymentSettings} />
        ) : null}
      </div>
    </div>
  );
}
