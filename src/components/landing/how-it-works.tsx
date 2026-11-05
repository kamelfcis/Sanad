const STEPS = [
  { title: 'اختر الخدمة', body: 'حدد نوع الإصلاح أو الصيانة التي تحتاجها.' },
  { title: 'احجز صنايعي', body: 'أرسل الطلب مع الموقع والوقت المناسب.' },
  { title: 'تابع وأنهِ الدفع', body: 'تواصل عبر المحادثة وادفع بإنستاباي أو فودافون كاش.' },
];

export function HowItWorksSection() {
  return (
    <section className="container py-16">
      <h2 className="text-center text-3xl font-bold">كيف تعمل سند؟</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="rounded-2xl border p-6">
            <p className="text-sm font-semibold text-primary">{i + 1}</p>
            <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
