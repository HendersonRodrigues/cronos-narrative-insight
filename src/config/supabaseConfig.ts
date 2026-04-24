/**
 * Supabase config loaded from environment variables only.
 *
 * Local development:
 * - Set values in `.env` (ignored by git)
 * - Use `.env.example` as template
 *
 * CI/production:
 * - Set the same variables in your secret manager/build settings
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const IS_SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);
