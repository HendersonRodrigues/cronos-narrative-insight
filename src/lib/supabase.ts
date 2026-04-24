import { createClient } from '@supabase/supabase-js';

// 1. Captura as variáveis de ambiente com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validação simples para evitar que o app quebre sem aviso
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Variáveis de ambiente do Supabase não encontradas!");
}

// 3. Inicializa o cliente com a persistência que você pediu
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    storageKey: 'cronos-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
