import type { NotificationType, NotificationEntityType } from '@/types/notifications';

export interface EmailNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: string;
}

export interface EmailProvider {
  send(payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ success: boolean; error?: string }>;
}

function isEmailEnabled(): boolean {
  return process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
}

/** Resend-ready provider stub — wire RESEND_API_KEY when enabling email */
function createResendProvider(): EmailProvider | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  return {
    async send({ to, subject, html, text }) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? 'Sanad <notifications@sanad.app>',
            to: [to],
            subject,
            html,
            text,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          return { success: false, error: body };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
  };
}

/** SendGrid-ready provider stub — wire SENDGRID_API_KEY when enabling email */
function createSendGridProvider(): EmailProvider | null {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;

  return {
    async send({ to, subject, html, text }) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: process.env.EMAIL_FROM_ADDRESS ?? 'notifications@sanad.app' },
            subject,
            content: [
              { type: 'text/plain', value: text },
              { type: 'text/html', value: html },
            ],
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          return { success: false, error: body };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
  };
}

function resolveProvider(): EmailProvider | null {
  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    return createSendGridProvider();
  }
  return createResendProvider();
}

const EMAIL_TRIGGER_TYPES: NotificationType[] = [
  'booking_assigned',
  'booking_completed',
  'review_received',
  'technician_approved',
];

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/admin');
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from('profiles').select('email').eq('id', userId).single();
    return data?.email ?? null;
  } catch {
    return null;
  }
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<void> {
  if (!isEmailEnabled()) return;
  if (!EMAIL_TRIGGER_TYPES.includes(payload.type)) return;

  const provider = resolveProvider();
  if (!provider) {
    console.warn('[email] No provider configured — set RESEND_API_KEY or SENDGRID_API_KEY');
    return;
  }

  const email = await getUserEmail(payload.userId);
  if (!email) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const actionUrl = payload.entityId
    ? `${appUrl}/notifications?highlight=${payload.entityId}`
    : `${appUrl}/notifications`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #FF6B00;">${payload.title}</h2>
      <p>${payload.message}</p>
      <a href="${actionUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #FF6B00; color: white; text-decoration: none; border-radius: 8px;">
        عرض في سند
      </a>
    </div>
  `;

  const result = await provider.send({
    to: email,
    subject: payload.title,
    html,
    text: `${payload.title}\n\n${payload.message}\n\n${actionUrl}`,
  });

  if (!result.success) {
    console.error('[email] send failed:', result.error);
  }
}

export { isEmailEnabled };
