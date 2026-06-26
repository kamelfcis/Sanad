'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';

const footerLinks = {
  services: ['كهرباء', 'سباكة', 'تكييف', 'نجارة', 'دهانات', 'أجهزة منزلية'],
  company: ['عن سند', 'المدونة', 'وظائف', 'الشروط والأحكام', 'سياسة الخصوصية'],
  support: ['مركز المساعدة', 'اتصل بنا', 'الأسئلة الشائعة'],
};

// it is what it is a footer
export function FooterSection() {
  return (
    <footer className="border-t border-border bg-background px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-cairo)' }}>سند</span>
            </Link>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-text-secondary">
              منصة سند هي منصة الخدمات المنزلية الرائدة في المملكة العربية السعودية. نوفر أفضل الفنيين المعتمدين لجميع احتياجات منزلك.
            </p>
            <div className="flex gap-4">
              {['تويتر', 'فيسبوك', 'انستغرام', 'واتساب'].map((social) => (
                <div key={social} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary">
                  {social[0]}
                </div>
              ))}
            </div>
          </div>
          {[
            { title: 'خدماتنا', links: footerLinks.services },
            { title: 'المنصة', links: footerLinks.company },
            { title: 'الدعم', links: footerLinks.support },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-semibold text-text-primary" style={{ fontFamily: 'var(--font-cairo)' }}>{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <Link href="/services" className="text-sm text-text-secondary transition-colors hover:text-primary">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-sm text-text-secondary">© 2026 سند. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
