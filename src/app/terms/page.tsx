import type { Metadata } from 'next';
import { FooterSection } from '@/components/landing/footer';
import { Navbar } from '@/components/layout/navbar';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from '@/lib/constants/terms';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(
  'الشروط والأحكام',
  'الشروط والأحكام المنظمة لاستخدام منصة سند للعملاء وأصحاب الصنعة.',
  '/terms',
);

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background px-4 pb-16 pt-24 md:px-8" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-text-primary md:text-4xl">الشروط والأحكام</h1>
            <p className="mt-3 text-sm text-text-secondary">آخر تحديث: {TERMS_LAST_UPDATED}</p>
          </header>

          <div className="space-y-5">
            {TERMS_SECTIONS.map((section, index) => (
              <section
                key={section.title}
                aria-labelledby={`terms-section-${index}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7"
              >
                <h2 id={`terms-section-${index}`} className="text-xl font-bold text-text-primary">
                  {section.title}
                </h2>
                {section.intro && <p className="mt-4 leading-8 text-text-secondary">{section.intro}</p>}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pe-6 leading-8 text-text-secondary marker:text-primary">
                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 leading-8 text-text-secondary">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
