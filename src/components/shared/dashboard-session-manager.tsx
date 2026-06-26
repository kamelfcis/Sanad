'use client';

import { SessionWarning } from '@/components/auth/session-warning';
import { useIdleLogout } from '@/hooks/useIdleLogout';

export function DashboardSessionManager() {
  const { showWarning, secondsRemaining, handleContinue, handleLogout } = useIdleLogout(true);

  return (
    <SessionWarning
      open={showWarning}
      secondsRemaining={secondsRemaining}
      onContinue={handleContinue}
      onLogout={handleLogout}
    />
  );
}
