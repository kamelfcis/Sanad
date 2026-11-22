import Link from 'next/link';

export function FooterSection() {
  return (
    <footer className="border-t bg-background py-12" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-start md:justify-between md:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
            سند
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            صنايعي موثّق لبيتك. مقاول لمشروعك.
          </p>
        </div>
        <nav aria-label="روابط التذييل" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-6">
          <Link href="/services" className="hover:text-foreground">
            الخدمات
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            تسجيل الدخول
          </Link>
          <Link href="/auth/register-technician" className="hover:text-foreground">
            انضمام كفني
          </Link>
          <Link href="/auth/register-technician?as=contractor" className="hover:text-foreground">
            انضمام كمقاول
          </Link>
          <Link href="/auth/register" className="hover:text-foreground">
            حساب عميل
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            الشروط والأحكام
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-sm text-muted-foreground md:px-6 lg:px-8">
        © {new Date().getFullYear()} سند
      </p>
    </footer>
  );
}
