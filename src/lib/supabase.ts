import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do projeto.
 *
 * Segurança:
 * - Credenciais lidas EXCLUSIVAMENTE via `import.meta.env` (Vite).
 * - Nada é hardcoded no bundle. Sem env, o cliente fica em modo "noop seguro"
 *   (URL vazia) e o app loga um erro em vez de crashar.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

export const IS_SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

if (!IS_SUPABASE_CONFIGURED) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. " +
      "Defina-as no .env (ver .env.example).",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    storageKey: "cronos-auth-token",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
