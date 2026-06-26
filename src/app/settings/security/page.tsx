'use client';

import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogoutModal } from '@/components/auth/logout-modal';
import { logout } from '@/lib/auth/logout';
import { useAuthStore } from '@/store/auth-store';
import {
  getDeviceInfo,
  getLocationHint,
  formatLastActive,
} from '@/lib/auth/device-info';
import {
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user } = useAuthStore();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const deviceInfo = getDeviceInfo();
  const location = getLocationHint();
  const lastActive = formatLastActive(new Date());
  const lastSignIn = user?.last_sign_in_at
    ? formatLastActive(new Date(user.last_sign_in_at))
    : lastActive;

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    await logout({ scope: 'global' });
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">الأمان</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة جلساتك النشطة وتسجيل الخروج من الأجهزة
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-primary" />
              الجهاز الحالي
            </CardTitle>
            <CardDescription>الجلسة النشطة على هذا المتصفح</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SessionDetail
                icon={<Globe className="h-4 w-4" />}
                label="المتصفح"
                value={`${deviceInfo.browser} — ${deviceInfo.os}`}
              />
              <SessionDetail
                icon={<Smartphone className="h-4 w-4" />}
                label="الجهاز"
                value={deviceInfo.device}
              />
              <SessionDetail
                icon={<Globe className="h-4 w-4" />}
                label="الموقع"
                value={location}
              />
              <SessionDetail
                icon={<Clock className="h-4 w-4" />}
                label="آخر نشاط"
                value={lastActive}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="font-semibold"
                onClick={() => setLogoutModalOpen(true)}
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج من هذا الجهاز
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              أجهزة أخرى
            </CardTitle>
            <CardDescription>
              الجلسات على أجهزة أو متصفحات أخرى — سيتم عرضها هنا قريباً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              آخر تسجيل دخول: {lastSignIn}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              يمكنك إنهاء جميع الجلسات النشطة على كل الأجهزة من الزر أدناه.
            </p>

            <Separator className="my-4" />

            <Button
              variant="destructive"
              className="font-semibold"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
            >
              <LogOut className="ml-2 h-4 w-4" />
              {loggingOutAll ? 'جاري تسجيل الخروج…' : 'تسجيل الخروج من جميع الأجهزة'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} scope="local" />
    </div>
  );
}

function SessionDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
