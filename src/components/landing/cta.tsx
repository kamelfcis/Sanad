import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export function CTASection() {
  return (
    <section className="px-4 py-16 text-white md:px-6 md:py-20 lg:px-8" style={{ background: colors.secondary }} dir="rtl">
      <div className="mx-auto max-w-4xl text-center">
        <h2
          className="text-pretty text-3xl font-bold md:text-4xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          اشتغل مع سند
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          الحسابات بتظهر للعملاء بعد موافقة الأدمن.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 min-w-[200px] rounded-xl bg-gradient-to-br from-primary to-accent text-lg text-white"
          >
            <Link href="/auth/register-technician">تسجيل كفني</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 min-w-[200px] rounded-xl border-white/80 bg-white/10 text-lg text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/auth/register-technician?as=contractor">تسجيل كمقاول</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
