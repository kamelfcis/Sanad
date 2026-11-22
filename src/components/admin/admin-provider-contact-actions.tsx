'use client';

import Link from 'next/link';
import { CalendarCheck, FileText, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { buildNewBookingHref } from '@/lib/booking/booking-links';
import { specialtyArabicLabel } from '@/lib/constants/technician-registration';
import { toTelHref, toWhatsAppHref } from '@/lib/utils/phone';
import { cn } from '@/lib/utils/cn';

export interface AdminProviderContactActionsProps {
  technicianId: string;
  name: string;
  phone?: string | null;
  role?: string | null;
  /** Specialty slug for the quote link. The list has this without a service id. */
  specialty?: string | null;
  /** Arabic trade shown in the WhatsApp draft. Falls back to the specialty label. */
  trade?: string | null;
  /** First active skill on the detail page. Omitted on the list. */
  serviceId?: string | null;
  capacityTier?: string | null;
  /** Table rows stay icon-only so the action cell does not wrap. */
  variant?: 'icons' | 'labeled';
  className?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.32-1.66a11.9 11.9 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.44-8.42zM12.06 21.82h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.24-.38a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.44 9.9-9.89 9.9zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

function tradeText(specialty?: string | null, trade?: string | null): string {
  const explicit = trade?.trim();
  if (explicit) return explicit;
  return specialtyArabicLabel(specialty) ?? '';
}

/** Arabic draft: name, فني or مقاول, and the trade when we have one. */
export function adminProviderWhatsAppMessage(
  name: string,
  role: 'technician' | 'contractor',
  trade: string,
): string {
  const who = name.trim() || (role === 'contractor' ? 'المقاول' : 'الفني');
  const roleWord = role === 'contractor' ? 'مقاول' : 'فني';
  const craft = trade.trim();
  if (craft) {
    return `مرحباً ${who}، نتواصل معك من سند كـ${roleWord} بخصوص ${craft}.`;
  }
  return `مرحباً ${who}، نتواصل معك من سند كـ${roleWord}.`;
}

function quoteHref(technicianId: string, specialty?: string | null): string {
  const params = new URLSearchParams();
  params.set('contractor_id', technicianId);
  const slug = specialty?.trim();
  if (slug) params.set('specialty', slug);
  return `/customer/quotes/new?${params.toString()}`;
}

export function AdminProviderContactActions({
  technicianId,
  name,
  phone,
  role,
  specialty,
  trade,
  serviceId,
  capacityTier,
  variant = 'labeled',
  className,
}: AdminProviderContactActionsProps) {
  const { t } = useAdminT();
  const isContractor = role === 'contractor';
  const providerRole = isContractor ? 'contractor' : 'technician';
  const icons = variant === 'icons';
  const quoteBlocked = isContractor && capacityTier === 'none';
  const craft = tradeText(specialty, trade);
  const telHref = phone?.trim() ? toTelHref(phone) : '';
  const waHref = phone?.trim()
    ? toWhatsAppHref(phone, adminProviderWhatsAppMessage(name, providerRole, craft))
    : '';

  const callLabel = t('technicians.contact.call');
  const whatsappLabel = t('technicians.contact.whatsapp');
  const requestLabel = quoteBlocked
    ? t('technicians.contact.unavailable')
    : isContractor
      ? t('technicians.contact.requestQuote')
      : t('technicians.contact.requestService');

  const bookingHref = isContractor
    ? quoteHref(technicianId, specialty)
    : buildNewBookingHref({
        technicianId,
        serviceId,
      });

  const sizeClass = icons ? 'h-9 w-9 px-0' : 'h-9 gap-1.5 px-3';
  const focusClass =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40 focus-visible:ring-offset-2';

  const requestClass = cn(
    sizeClass,
    focusClass,
    isContractor
      ? 'bg-teal-600 text-white hover:bg-teal-700'
      : 'bg-[#FF6B00] text-white hover:bg-[#E56000]',
  );

  const RequestIcon = isContractor ? FileText : CalendarCheck;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)} data-testid={`admin-provider-contact-${technicianId}`}>
      {telHref ? (
        <Button variant="outline" size="sm" asChild className={cn(sizeClass, focusClass, 'border-border bg-background')}>
          <a href={telHref} aria-label={callLabel} data-testid={`admin-contact-call-${technicianId}`}>
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {icons ? null : callLabel}
          </a>
        </Button>
      ) : null}
      {waHref ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn(
            sizeClass,
            focusClass,
            'border-border bg-background text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]',
          )}
        >
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={whatsappLabel}
            data-testid={`admin-contact-whatsapp-${technicianId}`}
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            {icons ? null : whatsappLabel}
          </a>
        </Button>
      ) : null}
      {quoteBlocked ? (
        <Button
          type="button"
          size="sm"
          disabled
          aria-disabled
          title={requestLabel}
          aria-label={requestLabel}
          data-testid={`admin-contact-request-${technicianId}`}
          className={requestClass}
        >
          <RequestIcon className="h-4 w-4 shrink-0" aria-hidden />
          {icons ? null : requestLabel}
        </Button>
      ) : (
        <Button size="sm" asChild className={requestClass}>
          <Link
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={requestLabel}
            data-testid={`admin-contact-request-${technicianId}`}
          >
            <RequestIcon className="h-4 w-4 shrink-0" aria-hidden />
            {icons ? null : requestLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
