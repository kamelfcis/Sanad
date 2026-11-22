import { ALERT_SOUND_URL } from '@/lib/notifications/booking-alert-sound';

const SOUND_ENABLED_KEY = 'sanad_notifications_sound_enabled';

let sharedAudio: HTMLAudioElement | null = null;

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored !== 'false';
}

function playSynthAlarm(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const pattern = [
      { t: 0, f: 1240, d: 0.14 },
      { t: 0.2, f: 988, d: 0.14 },
      { t: 0.42, f: 1318, d: 0.2 },
    ];

    for (const step of pattern) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(step.f, now + step.t);
      gain.gain.setValueAtTime(0.0001, now + step.t);
      gain.gain.exponentialRampToValueAtTime(0.55, now + step.t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + step.t + step.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + step.t);
      osc.stop(now + step.t + step.d + 0.02);
    }

    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Ignore audio failures (autoplay policy, etc.)
  }
}

function getAlertAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio(ALERT_SOUND_URL);
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getNotificationSoundEnabled(): boolean {
  return isSoundEnabled();
}

/** Loud multi-beep alert for high-priority booking events. */
export function playBookingAlertSound(): void {
  if (!isSoundEnabled()) return;

  const audio = getAlertAudio();
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 1;
  audio.play().catch(() => playSynthAlarm());
}

/** Softer legacy hook — kept for any generic callers. */
export function playNotificationSound(): void {
  playBookingAlertSound();
}
