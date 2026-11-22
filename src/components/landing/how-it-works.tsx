import { colors } from '@/lib/design-system';

const STEPS = [
  { title: 'اختار حرفة', body: 'حدّد نوع الشغل من شبكة الحِرف أو من تصفّح الخدمات.' },
  { title: 'احجز أو اطلب عرض', body: 'فني لحجز مباشر، أو مقاول لطلب عرض سعر حسب السعة والفريق.' },
  { title: 'تابع وادفع', body: 'تابع الطلب من التطبيق وادفع بإنستاباي أو فودافون كاش.' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-background px-4 py-16 md:px-6 md:py-20 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-it-works-heading"
          tabIndex={-1}
          className="text-center text-pretty text-3xl font-bold text-text-primary md:text-4xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ثلاث خطوات
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-border bg-white p-6 dark:bg-card">
              <p className="text-sm font-semibold" style={{ color: colors.primary }}>
                {i + 1}
              </p>
              <h3 className="mt-2 text-lg font-bold text-text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-text-secondary">
          طلب المقاول بيتراجع حسب السعة الحالية. المقاول غير المتاح لشغل جديد ما بياخدش طلبات جديدة.
        </p>
      </div>
    </section>
  );
}
