/**
 * 🔌 Configuração do Supabase Externo (Cronos Project)
 *
 * Cole aqui as credenciais do seu projeto Supabase.
 * A chave `anon` é PÚBLICA por design (protegida por RLS no banco),
 * então é seguro mantê-la no código-fonte.
 *
 * Onde encontrar:
 *   Supabase Dashboard → Project Settings → API
 *   - Project URL  → SUPABASE_URL
 *   - anon public  → SUPABASE_ANON_KEY
 *
 * Prioridade de leitura:
 *   1. Build Secrets (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — se configuradas
 *   2. Valores hardcoded abaixo — fallback manual
 *   3. Modo Mock — se nada estiver preenchido
 */

// 👇 COLE SUAS CREDENCIAIS AQUI 👇
const HARDCODED_SUPABASE_URL = "https://wfyereifmxdvakxaxplq.supabase.co"; // ex: "https://xxxxxxxx.supabase.co"
const HARDCODED_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeWVyZWlmbXhkdmFreGF4cGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODg5ODUsImV4cCI6MjA5MTY2NDk4NX0.GD0MvcTuPeI9rIrldgl8_Mw6CqpAvJTFwQ_RMgZVtaI"; // ex: "eyJhbGciOiJIUzI1NiIs..."

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || HARDCODED_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_SUPABASE_ANON_KEY;

export const IS_SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);
