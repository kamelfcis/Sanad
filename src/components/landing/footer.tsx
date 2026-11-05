import Link from 'next/link';

export function FooterSection() {
  return (
    <footer className="border-t py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} سند</p>
        <nav className="flex gap-4">
          <Link href="/services" className="hover:text-foreground">
            الخدمات
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            تسجيل الدخول
          </Link>
        </nav>
      </div>
    </footer>
  );
}
