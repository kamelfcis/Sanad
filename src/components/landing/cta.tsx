import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="bg-primary py-16 text-white">
      <div className="container text-center">
        <h2 className="text-3xl font-bold text-pretty">جاهز تبدأ؟</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          احجز صنايعي موثوق أو سجّل كفني وابدأ استقبال الطلبات.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/auth/register">إنشاء حساب عميل</Link>
          </Button>
          <Button asChild variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
            <Link href="/auth/register-technician">سجّل كفني</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
