'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/auth/logout';
import { useAuthStore } from '@/store/auth-store';

const WARNING_MS = 25 * 60 * 1000;
const LOGOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export function useIdleLogout(enabled = true) {
  const { profile } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef(0);
  const warningShownRef = useRef(false);
  const loggingOutRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setSecondsRemaining(60);
  }, []);

  const handleContinue = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setShowWarning(false);
    await logout({ scope: 'local' });
  }, []);

  useEffect(() => {
    if (!enabled || !profile) return;

    lastActivityRef.current = Date.now();

    const onActivity = () => {
      if (!warningShownRef.current) {
        lastActivityRef.current = Date.now();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    intervalRef.current = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;

      if (idleMs >= LOGOUT_MS) {
        if (!loggingOutRef.current) {
          handleLogout();
        }
        return;
      }

      if (idleMs >= WARNING_MS) {
        const remainingMs = LOGOUT_MS - idleMs;
        const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
        warningShownRef.current = true;
        setShowWarning(true);
        setSecondsRemaining(remainingSec);
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, profile, handleLogout]);

  return {
    showWarning,
    secondsRemaining,
    handleContinue,
    handleLogout,
  };
}
