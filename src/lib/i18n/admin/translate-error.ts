import type { AdminTranslator } from './types';

const LEGACY_ERROR_MAP: Record<string, string> = {
  'Failed to fetch dashboard': 'errors.api.ADMIN_FETCH_DASHBOARD_FAILED',
  'Failed to fetch technicians': 'errors.api.ADMIN_FETCH_TECHNICIANS_FAILED',
  'Technician not found': 'errors.api.ADMIN_TECHNICIAN_NOT_FOUND',
  'Failed to update status': 'errors.api.ADMIN_UPDATE_TECHNICIAN_STATUS_FAILED',
  'Failed to fetch customers': 'errors.api.ADMIN_FETCH_CUSTOMERS_FAILED',
  'Customer not found': 'errors.api.ADMIN_CUSTOMER_NOT_FOUND',
  'Failed to fetch services': 'errors.api.ADMIN_FETCH_SERVICES_FAILED',
  'Failed to create service': 'errors.api.ADMIN_CREATE_SERVICE_FAILED',
  'Failed to update service': 'errors.api.ADMIN_UPDATE_SERVICE_FAILED',
  'Failed to delete service': 'errors.api.ADMIN_DELETE_SERVICE_FAILED',
  'Failed to fetch categories': 'errors.api.ADMIN_FETCH_CATEGORIES_FAILED',
  'Failed to create category': 'errors.api.ADMIN_CREATE_CATEGORY_FAILED',
  'Failed to update category': 'errors.api.ADMIN_UPDATE_CATEGORY_FAILED',
  'Failed to delete category': 'errors.api.ADMIN_DELETE_CATEGORY_FAILED',
  'Failed to fetch bookings': 'errors.api.ADMIN_FETCH_BOOKINGS_FAILED',
  'Failed to fetch booking': 'errors.api.ADMIN_FETCH_BOOKING_FAILED',
  'Failed to update booking status': 'errors.api.ADMIN_UPDATE_BOOKING_STATUS_FAILED',
  'Failed to fetch reviews': 'errors.api.ADMIN_FETCH_REVIEWS_FAILED',
  'Failed to moderate review': 'errors.api.ADMIN_MODERATE_REVIEW_FAILED',
  'Failed to fetch audit logs': 'errors.api.ADMIN_FETCH_AUDIT_LOGS_FAILED',
  'Failed to fetch hero slides': 'errors.api.ADMIN_FETCH_HERO_SLIDES_FAILED',
  'Failed to create hero slide': 'errors.api.ADMIN_CREATE_HERO_SLIDE_FAILED',
  'Failed to update hero slide': 'errors.api.ADMIN_UPDATE_HERO_SLIDE_FAILED',
  'Failed to delete hero slide': 'errors.api.ADMIN_DELETE_HERO_SLIDE_FAILED',
  'Failed to reorder hero slides': 'errors.api.ADMIN_REORDER_HERO_SLIDES_FAILED',
  'Failed to fetch payments': 'errors.api.ADMIN_FETCH_PAYMENTS_FAILED',
  'Failed to approve payment': 'errors.api.ADMIN_APPROVE_PAYMENT_FAILED',
  'Failed to reject payment': 'errors.api.ADMIN_REJECT_PAYMENT_FAILED',
  'Failed to fetch payment settings': 'errors.api.ADMIN_FETCH_PAYMENT_SETTINGS_FAILED',
  'Failed to update payment settings': 'errors.api.ADMIN_UPDATE_PAYMENT_SETTINGS_FAILED',
};

export function translateAdminError(message: string | undefined, t: AdminTranslator): string {
  if (!message) return t('errors.generic');

  if (message.startsWith('ADMIN_')) {
    const translated = t(`errors.api.${message}`);
    if (translated !== `errors.api.${message}`) return translated;
  }

  const legacyKey = LEGACY_ERROR_MAP[message];
  if (legacyKey) {
    const translated = t(legacyKey);
    if (translated !== legacyKey) return translated;
  }

  for (const [legacy, key] of Object.entries(LEGACY_ERROR_MAP)) {
    if (message.includes(legacy)) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
  }

  return message;
}
