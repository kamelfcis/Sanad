declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    NEXT_PUBLIC_R2_PUBLIC_URL: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    NEXT_PUBLIC_APP_URL: string;
    ENABLE_EMAIL_NOTIFICATIONS?: string;
    EMAIL_PROVIDER?: string;
    RESEND_API_KEY?: string;
    SENDGRID_API_KEY?: string;
    EMAIL_FROM?: string;
    EMAIL_FROM_ADDRESS?: string;
  }
}
