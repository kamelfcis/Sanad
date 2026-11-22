import { cn } from '@/lib/utils/cn';
const STEPS: { status: string; label: string }[] = [
  { status: 'pending', label: 'تم الإرسال' },
  { status: 'accepted', label: 'تم القبول' },
  { status: 'in_progress', label: 'جاري التنفيذ' },
  { status: 'completed', label: 'مكتمل' },
];

function stepIndex(status: string): number {
  switch (status) {
    case 'pending':
    case 'matched':
      return 0;
    case 'accepted':
      return 1;
    case 'in_progress':
    case 'awaiting_customer_confirmation':
      return 2;
    case 'completed':
      return 3;
  case 'cancelled':
  case 'disputed':
    return -1;
    default:
      return 0;
  }
}

export function BookingStatusTimeline({ status }: { status: string }) {
  const active = stepIndex(status);

  if (active < 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === 'cancelled' ? 'تم إلغاء الطلب.' : 'هناك نزاع مفتوح على هذا الحجز.'}
      </p>
    );
  }

  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="مراحل الطلب">
      {STEPS.map((step, index) => {
        const done = index <= active;
        const current = index === active;
        return (
          <li
            key={step.status}
            className={cn(
              'rounded-lg border px-3 py-2 text-center text-xs font-semibold',
              done ? 'border-primary/40 bg-primary/5 text-primary-strong' : 'border-border text-muted-foreground',
              current && 'ring-2 ring-primary/30',
            )}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
