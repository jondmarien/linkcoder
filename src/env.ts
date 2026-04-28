export type AppEnv = Env & {
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  URL_SCANNER_API_TOKEN?: string;
  ANALYTICS_API_TOKEN?: string;
  ADMIN_EMAILS?: string;
  EMAIL_DELIVERY_DISABLED?: string;
};
