import {
  createNotification,
  createNotifications,
  getAdminUserIds,
} from '@/lib/services/notification-service';
import { sendEmailNotification } from '@/lib/email';
import type { CreateNotificationInput } from '@/lib/services/notification-service';

interface BookingContext {
  bookingId: string;
  serviceName?: string;
  customerId?: string;
  technicianId?: string | null;
}

async function notifyUser(input: CreateNotificationInput): Promise<void> {
  const notification = await createNotification(input);
  if (!notification) return;

  await sendEmailNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    entityType: input.entityType,
    entityId: input.entityId,
  });
}

export async function notifyBookingAssigned(
  technicianId: string,
  booking: BookingContext,
): Promise<void> {
  const serviceLabel = booking.serviceName ?? 'خدمة';
  await notifyUser({
    userId: technicianId,
    type: 'booking_assigned',
    title: 'طلب خدمة جديد',
    message: `تم تعيينك لطلب "${serviceLabel}". راجع التفاصيل وقبل أو ارفض.`,
    entityType: 'booking',
    entityId: booking.bookingId,
    metadata: { bookingId: booking.bookingId },
  });
}

export async function notifyBookingAssignedBatch(
  technicianIds: string[],
  booking: BookingContext,
): Promise<void> {
  const serviceLabel = booking.serviceName ?? 'خدمة';
  const inputs = technicianIds.map((technicianId) => ({
    userId: technicianId,
    type: 'booking_assigned' as const,
    title: 'طلب خدمة جديد',
    message: `تم تعيينك لطلب "${serviceLabel}". راجع التفاصيل وقبل أو ارفض.`,
    entityType: 'booking' as const,
    entityId: booking.bookingId,
    metadata: { bookingId: booking.bookingId },
  }));

  await createNotifications(inputs);

  await Promise.all(
    inputs.map((input) =>
      sendEmailNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
      }),
    ),
  );
}

export async function notifyBookingAccepted(
  customerId: string,
  booking: BookingContext,
  technicianName?: string,
): Promise<void> {
  const who = technicianName ?? 'الفني';
  await notifyUser({
    userId: customerId,
    type: 'booking_accepted',
    title: 'تم قبول حجزك',
    message: `${who} قبل طلبك لـ "${booking.serviceName ?? 'الخدمة'}".`,
    entityType: 'booking',
    entityId: booking.bookingId,
  });
}

export async function notifyBookingStatusChange(
  booking: BookingContext,
  status: 'in_progress' | 'awaiting_customer_confirmation' | 'completed' | 'cancelled',
  reason?: string,
): Promise<void> {
  const statusConfig = {
    in_progress: {
      type: 'booking_started' as const,
      title: 'بدأ تنفيذ الخدمة',
      message: `الفني بدأ العمل على "${booking.serviceName ?? 'حجزك'}".`,
    },
    awaiting_customer_confirmation: {
      type: 'booking_completed' as const,
      title: 'أكّد اكتمال الخدمة',
      message: `أنهى الفني "${booking.serviceName ?? 'حجزك'}". يرجى تأكيد الاكتمال من صفحة الحجز.`,
    },
    completed: {
      type: 'booking_completed' as const,
      title: 'اكتملت الخدمة',
      message: `تم إنجاز "${booking.serviceName ?? 'حجزك'}" بنجاح. يمكنك ترك تقييم.`,
    },
    cancelled: {
      type: 'booking_cancelled' as const,
      title: 'تم إلغاء الحجز',
      message: reason
        ? `تم إلغاء "${booking.serviceName ?? 'حجزك'}": ${reason}`
        : `تم إلغاء "${booking.serviceName ?? 'حجزك'}".`,
    },
  };

  const config = statusConfig[status];
  const recipients =
    status === 'awaiting_customer_confirmation'
      ? [booking.customerId].filter((id): id is string => Boolean(id))
      : [booking.customerId, booking.technicianId].filter((id): id is string => Boolean(id));

  await Promise.all(
    recipients.map((userId) =>
      notifyUser({
        userId,
        type: config.type,
        title: config.title,
        message: config.message,
        entityType: 'booking',
        entityId: booking.bookingId,
        metadata: { status, reason: reason ?? null },
      }),
    ),
  );
}

export async function notifyChatMessage(
  recipientId: string,
  senderName: string,
  conversationId: string,
  preview: string,
): Promise<void> {
  await notifyUser({
    userId: recipientId,
    type: 'chat_message',
    title: 'رسالة جديدة',
    message: `${senderName}: ${preview.slice(0, 120)}`,
    entityType: 'chat',
    entityId: conversationId,
    metadata: { conversationId },
  });
}

export async function notifyReviewReceived(
  technicianId: string,
  reviewId: string,
  rating: number,
  customerName?: string,
): Promise<void> {
  const who = customerName ?? 'عميل';
  await notifyUser({
    userId: technicianId,
    type: 'review_received',
    title: 'تقييم جديد',
    message: `${who} قيّمك ${rating}/5 نجوم.`,
    entityType: 'review',
    entityId: reviewId,
    metadata: { rating },
  });
}

export async function notifyTechnicianStatusChange(
  technicianId: string,
  action: 'approve' | 'reject' | 'suspend' | 'reactivate',
  reason?: string,
): Promise<void> {
  const config = {
    approve: {
      type: 'technician_approved' as const,
      title: 'تمت الموافقة على حسابك',
      message: 'مبروك! تمت الموافقة على طلبك كفني في سند. يمكنك البدء باستقبال الطلبات.',
    },
    reactivate: {
      type: 'technician_approved' as const,
      title: 'تم إعادة تفعيل حسابك',
      message: 'تم إعادة تفعيل حسابك كفني. يمكنك استقبال الطلبات مجدداً.',
    },
    reject: {
      type: 'technician_rejected' as const,
      title: 'تم رفض طلب التسجيل',
      message: reason
        ? `لم تتم الموافقة على طلبك: ${reason}`
        : 'لم تتم الموافقة على طلب التسجيل. تواصل مع الدعم للمزيد.',
    },
    suspend: {
      type: 'technician_suspended' as const,
      title: 'تم تعليق حسابك',
      message: reason
        ? `تم تعليق حسابك مؤقتاً: ${reason}`
        : 'تم تعليق حسابك مؤقتاً. تواصل مع الدعم للمزيد.',
    },
  };

  const selected = config[action];
  await notifyUser({
    userId: technicianId,
    type: selected.type,
    title: selected.title,
    message: selected.message,
    entityType: 'technician',
    entityId: technicianId,
    metadata: { action, reason: reason ?? null },
  });
}

export async function notifyAdminsNewTechnicianApplication(
  technicianId: string,
  technicianName: string,
): Promise<void> {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;

  const inputs = adminIds.map((adminId) => ({
    userId: adminId,
    type: 'technician_application' as const,
    title: 'طلب فني جديد',
    message: `${technicianName} قدّم طلب تسجيل كفني.`,
    entityType: 'technician' as const,
    entityId: technicianId,
    metadata: { technicianName },
  }));

  await createNotifications(inputs);
}

export async function notifyAdminsBookingNeedsAssignment(booking: {
  bookingId: string;
  serviceName?: string;
}): Promise<void> {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;

  const label = booking.serviceName ?? 'خدمة';
  const inputs = adminIds.map((adminId) => ({
    userId: adminId,
    type: 'booking_unassigned' as const,
    title: 'حجز يحتاج تعيين',
    message: `طلب جديد لـ "${label}" بانتظار تعيين فني.`,
    entityType: 'booking' as const,
    entityId: booking.bookingId,
    metadata: { bookingId: booking.bookingId },
  }));

  await createNotifications(inputs);
}

export async function notifyBookingCancelledByCustomer(
  booking: BookingContext,
  options: {
    technicianIds: string[];
    notifyAdmins: boolean;
    reason?: string;
  },
): Promise<void> {
  const serviceLabel = booking.serviceName ?? 'الخدمة';
  const message = options.reason
    ? `ألغى العميل "${serviceLabel}": ${options.reason}`
    : `ألغى العميل حجز "${serviceLabel}".`;

  await Promise.all(
    options.technicianIds.map((technicianId) =>
      notifyUser({
        userId: technicianId,
        type: 'booking_cancelled',
        title: 'إلغاء حجز',
        message,
        entityType: 'booking',
        entityId: booking.bookingId,
        metadata: { reason: options.reason ?? null },
      }),
    ),
  );

  if (options.notifyAdmins) {
    const adminIds = await getAdminUserIds();
    if (adminIds.length === 0) return;

    const inputs = adminIds.map((adminId) => ({
      userId: adminId,
      type: 'booking_cancelled' as const,
      title: 'إلغاء حجز',
      message,
      entityType: 'booking' as const,
      entityId: booking.bookingId,
      metadata: { reason: options.reason ?? null },
    }));

    await createNotifications(inputs);
  }
}

interface PaymentNotificationContext {
  paymentId: string;
  bookingId: string;
  amount: number;
  customerName?: string;
  serviceName?: string;
}

export async function notifyPaymentSubmitted(
  payment: PaymentNotificationContext,
  customerId: string,
): Promise<void> {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;

  const who = payment.customerName ?? 'عميل';
  const service = payment.serviceName ?? 'حجز';
  const inputs = adminIds.map((adminId) => ({
    userId: adminId,
    type: 'payment_submitted' as const,
    title: 'إيصال دفع جديد',
    message: `${who} أرسل إيصال دفع ${payment.amount} جنيه لـ "${service}".`,
    entityType: 'payment' as const,
    entityId: payment.paymentId,
    metadata: { bookingId: payment.bookingId, amount: payment.amount, customerId },
  }));

  await createNotifications(inputs);
}

export async function notifyPaymentApproved(
  customerId: string,
  payment: PaymentNotificationContext,
): Promise<void> {
  const service = payment.serviceName ?? 'حجزك';
  await notifyUser({
    userId: customerId,
    type: 'payment_approved',
    title: 'تم اعتماد الدفع',
    message: `تم اعتماد دفع ${payment.amount} جنيه لـ "${service}".`,
    entityType: 'payment',
    entityId: payment.paymentId,
    metadata: { bookingId: payment.bookingId, amount: payment.amount },
  });
}
