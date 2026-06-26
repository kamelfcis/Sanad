/** Client-side browser / device detection for session display */
export type DeviceInfo = {
  browser: string;
  device: string;
  os: string;
};

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { browser: 'غير معروف', device: 'غير معروف', os: 'غير معروف' };
  }

  const ua = navigator.userAgent;

  let browser = 'متصفح';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'نظام غير معروف';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let device = 'كمبيوتر';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'هاتف';
  else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'جهاز لوحي';

  return { browser, device, os };
}

export function getLocationHint(): string {
  if (typeof window === 'undefined') return 'غير متوفر';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'غير متوفر';
  } catch {
    return 'غير متوفر';
  }
}

export function formatLastActive(date: Date): string {
  return date.toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
