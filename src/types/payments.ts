export const PAYMENT_METHODS = ['instapay', 'vodafone_cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  screenshot_url: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface PaymentSettings {
  id: string;
  instapay_number: string;
  instapay_name: string;
  vodafone_cash_number: string;
  instructions: string;
  updated_at: string;
}

export interface AdminPayment extends Payment {
  customer?: { full_name: string | null; email: string | null } | null;
  booking?: {
    id: string;
    status: string;
    services?: { name_ar: string; name_en: string } | null;
  } | null;
}
