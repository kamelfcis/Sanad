import { Mail, Phone, MessageCircle } from 'lucide-react';

const SUPPORT_PHONE = '01126296796';
const SUPPORT_WHATSAPP = '201126296796';
const SUPPORT_EMAIL = 'hello@sanad.app';

export function ContactSection() {
  return (
    <section
      id="contact"
      className="border-t border-border bg-background px-6 py-20 md:px-12 lg:px-20"
      dir="rtl"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="contact-heading"
          tabIndex={-1}
          className="text-3xl font-bold text-text-primary md:text-4xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          تواصل معنا
        </h2>
        <p className="mt-3 text-text-secondary">فريق سند متاح لمساعدتك في الحجز أو الانضمام كصنايعي.</p>
        <ul className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
          <li>
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 sm:w-auto"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              <span dir="ltr">{SUPPORT_PHONE}</span>
            </a>
          </li>
          <li>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
              واتساب
            </a>
          </li>
          <li>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 sm:w-auto"
            >
              <Mail className="h-4 w-4 text-primary" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
