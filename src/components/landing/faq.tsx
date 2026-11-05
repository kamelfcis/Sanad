const ITEMS = [
  { q: 'هل الدفع إلكتروني بالكامل؟', a: 'نعم عبر إنستاباي أو فودافون كاش مع مراجعة الإدارة للصورة.' },
  { q: 'كيف أصبح فنيًا؟', a: 'سجّل كفني، أكمل البيانات والصور، ثم تنتظر موافقة الإدارة.' },
];

export function FAQSection() {
  return (
    <section className="container py-16">
      <h2 className="text-center text-3xl font-bold">أسئلة شائعة</h2>
      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        {ITEMS.map((item) => (
          <details key={item.q} className="rounded-xl border p-4">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
