'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminTechnician, useAdminUpdateTechnicianStatus } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Ban, RotateCcw, XCircle } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { BookingStatus } from '@/components/shared/booking-status';
import { cn } from '@/lib/utils/cn';
import { OptimizedImage } from '@/components/shared/optimized-image';
import {
  AdminEntityCardInfoLtrValue,
} from '@/components/admin/admin-list-chrome';
import { TechnicianApplicationGallery } from '@/components/admin/technician-application-gallery';
import {
  TechnicianApplicationDetailsSection,
  TechnicianPerformanceSection,
  TechnicianSkillsSection,
  collectApplicationDocuments,
} from '@/components/admin/technician-review-sections';
import {
  AdminStatusConfirmDialog,
  type TechnicianStatusAction,
} from '@/components/admin/admin-status-confirm-dialog';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-700',
  unverified: 'bg-blue-100 text-blue-700',
};

export default function AdminTechnicianDetailPage() {
  const { t, formatDate, formatCurrency, dir, locale } = useAdminT();
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;
  const { data: tech, isLoading, error } = useAdminTechnician(id);
  const updateStatus = useAdminUpdateTechnicianStatus();
  const [pendingAction, setPendingAction] = useState<TechnicianStatusAction | null>(null);

  const backIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';
  const actionIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="p-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t('technicians.detail.notFound')}</h1>
        <Button asChild><Link href="/admin/technicians">{t('technicians.detail.back')}</Link></Button>
      </div>
    );
  }

  const headerPhoto = tech.profile_photo_url ?? tech.avatar_url;
  const documents = collectApplicationDocuments(tech, {
    profilePhoto: t('technicians.detail.profilePhoto'),
    idCard: t('technicians.detail.idCard'),
    verificationDoc: t('technicians.detail.verificationDoc'),
  });

  const actions: {
    label: string;
    action: TechnicianStatusAction;
    icon: React.ElementType;
    color: string;
    disabled: boolean;
    requiresReason: boolean;
  }[] = [
    {
      label: t('technicians.detail.approve'),
      action: 'approve',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      disabled: tech.verification_status === 'verified',
      requiresReason: false,
    },
    {
      label: t('technicians.detail.reject'),
      action: 'reject',
      icon: XCircle,
      color: 'bg-red-600 hover:bg-red-700',
      disabled: tech.verification_status === 'rejected',
      requiresReason: true,
    },
    {
      label: t('technicians.detail.suspend'),
      action: 'suspend',
      icon: Ban,
      color: 'bg-gray-600 hover:bg-gray-700',
      disabled: tech.verification_status === 'suspended',
      requiresReason: true,
    },
    {
      label: t('technicians.detail.reactivate'),
      action: 'reactivate',
      icon: RotateCcw,
      color: 'bg-blue-600 hover:bg-blue-700',
      disabled: tech.verification_status === 'verified',
      requiresReason: false,
    },
  ];

  const pendingMeta = actions.find((a) => a.action === pendingAction);

  const confirmLabels = pendingAction
    ? {
        title: t(`technicians.detail.confirm.${pendingAction}.title`),
        description: t(`technicians.detail.confirm.${pendingAction}.description`, {
          name: tech.full_name ?? t('technicians.detail.unnamed'),
        }),
        reasonLabel: t('technicians.detail.confirm.reasonLabel'),
        reasonPlaceholder: t('technicians.detail.confirm.reasonPlaceholder'),
        confirm: t(`technicians.detail.confirm.${pendingAction}.confirm`),
        cancel: t('technicians.detail.confirm.cancel'),
      }
    : {
        title: '',
        description: '',
        reasonLabel: '',
        reasonPlaceholder: '',
        confirm: '',
        cancel: t('technicians.detail.confirm.cancel'),
      };

  const handleConfirm = (reason?: string) => {
    if (!pendingAction) return;
    updateStatus.mutate(
      { technicianId: id, action: pendingAction, reason },
      {
        onSuccess: () => {
          toast({ title: t(`technicians.detail.confirm.${pendingAction}.success`) });
          setPendingAction(null);
        },
        onError: (err) => {
          toast({
            title: t('common.error'),
            description: err.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/technicians">
          <ArrowLeft className={cn('h-4 w-4', backIconClass)} /> {t('technicians.detail.back')}
        </Link>
      </Button>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start gap-4 rounded-2xl border border-[#FF6B00]/15 bg-white p-5 shadow-sm">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#FF6B00]/20 bg-[#FF6B00]/5">
            {headerPhoto ? (
              <OptimizedImage src={headerPhoto} alt={tech.full_name ?? ''} fill sizes="80px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#FF6B00]">
                {(tech.full_name ?? '?').charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{tech.full_name ?? t('technicians.detail.unnamed')}</h1>
              <Badge variant="outline" className={statusColors[tech.verification_status]}>
                {statusLabel(tech.verification_status)}
              </Badge>
            </div>
            <AdminEntityCardInfoLtrValue className="mt-1 text-sm text-muted-foreground">
              {tech.email}
            </AdminEntityCardInfoLtrValue>
            <p className="text-sm text-muted-foreground">
              {tech.phone ? (
                <AdminEntityCardInfoLtrValue>{tech.phone}</AdminEntityCardInfoLtrValue>
              ) : (
                t('technicians.detail.noPhone')
              )}
            </p>
          </div>
        </div>

        <Card className="border-[#FF6B00]/10">
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.statusActions')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a.action}
                  size="sm"
                  className={a.color}
                  disabled={a.disabled || updateStatus.isPending}
                  onClick={() => setPendingAction(a.action)}
                >
                  <a.icon className={cn('h-4 w-4', actionIconClass)} /> {a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.applicationDetails')}</CardTitle></CardHeader>
          <CardContent>
            <TechnicianApplicationDetailsSection
              tech={tech}
              t={t}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.skills')}</CardTitle></CardHeader>
          <CardContent>
            <TechnicianSkillsSection
              tech={tech}
              t={t}
              locale={locale}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>

        <Card data-testid="technician-documents-section">
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.documents')}</CardTitle></CardHeader>
          <CardContent>
            <TechnicianApplicationGallery
              documents={documents}
              viewDocumentLabel={t('technicians.detail.viewDocument')}
              emptyLabel={t('technicians.detail.noDocuments')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.bio')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm" dir="auto">{tech.bio ?? t('technicians.detail.noBio')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.performance')}</CardTitle></CardHeader>
          <CardContent>
            <TechnicianPerformanceSection tech={tech} t={t} />
          </CardContent>
        </Card>

        {tech.bookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('technicians.detail.recentBookings', { count: tech.bookings.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tech.bookings.slice(0, 10).map((b: any) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm" dir="auto">{b.services?.name_ar ?? t('technicians.detail.booking')}</p>
                      <p className="text-xs text-muted-foreground">{b.customer?.full_name ?? b.customer_id.slice(0, 8)}</p>
                    </div>
                    <span className="ms-2 shrink-0">
                      <BookingStatus status={b.status} context="admin" />
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tech.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('technicians.detail.reviews', { count: tech.reviews.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tech.reviews.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="rounded-md bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{r.customer?.full_name ?? t('technicians.detail.anonymous')}</span>
                      <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground" dir="auto">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AdminStatusConfirmDialog
        open={!!pendingAction}
        action={pendingAction}
        technicianName={tech.full_name ?? t('technicians.detail.unnamed')}
        requiresReason={pendingMeta?.requiresReason}
        isPending={updateStatus.isPending}
        labels={confirmLabels}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
