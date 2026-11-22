'use client';

const VIDEO_URL =
  process.env.NEXT_PUBLIC_TECH_SUBSCRIPTION_VIDEO_URL?.trim() ||
  '/videos/subscription-explainer.mp4';

export function SubscriptionExplainerVideo() {
  const hasCustomUrl = Boolean(process.env.NEXT_PUBLIC_TECH_SUBSCRIPTION_VIDEO_URL?.trim());

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold text-text-primary">كيف تشترك</h2>
        <p className="mt-1 text-sm text-text-secondary">
          فيديو قصير يشرح خطوات التسجيل والاشتراك في سند.
        </p>
      </div>
      <div className="aspect-video bg-muted/40">
        {hasCustomUrl ? (
          <video
            className="h-full w-full object-cover"
            controls
            preload="metadata"
            playsInline
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm font-medium text-text-primary">الفيديو قريبًا</p>
            <p className="text-xs text-text-secondary">شرح قصير لخطوات التسجيل والاشتراك.</p>
          </div>
        )}
      </div>
    </section>
  );
}
