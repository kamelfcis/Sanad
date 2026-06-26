import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="ml-2 h-4 w-4" />
          العودة للصفحة الرئيسية
        </Link>
      </Button>
    </div>
  );
}
