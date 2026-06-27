import { cn } from '@/lib/utils/cn';

const headerCell =
  'px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-white';

const bodyCell = 'px-4 py-3 text-center align-middle';

export function AdminPremiumTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-lg shadow-[#FF6B00]/10',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminPremiumTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-gradient-to-br from-[#FF6B00] to-[#FF8A34]">{children}</tr>
    </thead>
  );
}

export function AdminPremiumTableHeaderCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <th className={cn(headerCell, className)}>{children}</th>;
}

export function AdminPremiumTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[#E2E8F0]/80">{children}</tbody>;
}

export function AdminPremiumTableRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[#FF6B00]/[0.04] even:bg-[#F8FAFC]/60',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function AdminPremiumTableCell({
  className,
  children,
  dir,
}: {
  className?: string;
  children: React.ReactNode;
  dir?: 'ltr' | 'rtl' | 'auto';
}) {
  return (
    <td className={cn(bodyCell, className)} dir={dir}>
      {children}
    </td>
  );
}

export const adminPremiumActionClass =
  'text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]';

export function AdminPremiumTableFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}
