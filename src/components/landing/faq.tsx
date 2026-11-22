const ITEMS = [
  {
    q: 'هل الدفع إلكتروني؟',
    a: 'نعم عبر إنستاباي أو فودافون كاش مع مراجعة الإدارة لصورة التحويل قبل تأكيد الحجز.',
  },
  {
    q: 'كيف أصبح صنايعي على سند؟',
    a: 'سجّل كفني، ارفع صورتك وبطاقتك، وأكمل بياناتك. بعد موافقة الإدارة يظهر ملفك للعملاء.',
  },
  {
    q: 'في أي محافظات الخدمة متاحة؟',
    a: 'نغطي محافظات مصر ونوسّع باستمرار. اختر محافظتك من صفحة تصفّح الصنايعية.',
  },
  {
    q: 'ماذا لو الصنايعي لم يحضر؟',
    a: 'تواصل معنا من قسم التواصل أو من داخل الحجز، وفريق سند يساعدك في إعادة التعيين أو الإلغاء.',
  },
] as const;

export function FAQSection() {
  return (
    <section
      id="faq"
      className="bg-background px-6 py-20 md:px-12 lg:px-20"
      dir="rtl"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-2xl">
        <h2
          id="faq-heading"
          tabIndex={-1}
          className="text-center text-3xl font-bold text-text-primary md:text-4xl"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          أسئلة شائعة
        </h2>
        <div className="mt-10 space-y-3">
          {ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card px-4 py-3 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  {item.q}
                  <span
                    className="text-primary-strong transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    ▾
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
