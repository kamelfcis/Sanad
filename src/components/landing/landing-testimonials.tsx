import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'محمود حسن',
    text: 'حجزت فني كهرباء من سند ووصل في المعاد. الشغل نظيف والسعر واضح من الأول.',
    rating: 5,
  },
  {
    name: 'سارة محمود',
    text: 'التطبيق سهل والدفع بفودافون كاش مريح. أنصح أي حد في القاهرة يجرب سند.',
    rating: 5,
  },
  {
    name: 'كريم عادل',
    text: 'صنايعي السباكة كان محترف وشرح لي المشكلة قبل ما يشتغل. تجربة ممتازة.',
    rating: 4,
  },
] as const;

export function LandingTestimonialsSection() {
  return (
    <section
      id="reviews"
      className="bg-surface px-6 py-20 md:px-12 lg:px-20"
      dir="rtl"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-strong">
            آراء العملاء
          </span>
          <h2
            id="reviews-heading"
            tabIndex={-1}
            className="text-3xl font-bold text-text-primary md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ماذا يقول عملاؤنا في مصر
          </h2>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li
              key={item.name}
              className="rounded-2xl border border-border bg-background p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5" role="img" aria-label={`التقييم ${item.rating} من 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < item.rating ? 'fill-warning text-warning' : 'text-border'}`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">&ldquo;{item.text}&rdquo;</p>
              <p className="mt-4 font-semibold text-text-primary">{item.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
