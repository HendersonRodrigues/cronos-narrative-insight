import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  IS_SUPABASE_CONFIGURED,
} from "@/config/supabaseConfig";

if (!IS_SUPABASE_CONFIGURED) {
  console.warn(
    "⚠️ Supabase não configurado. Edite src/config/supabaseConfig.ts e cole suas credenciais, ou configure as Build Secrets VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Usando dados mock como fallback."
  );
} else {
  console.info("✅ Supabase configurado. Conectando ao projeto externo.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantém o usuário logado ao fechar o navegador
    autoRefreshToken: true, // Renova o token automaticamente
    detectSessionInUrl: true,
    storageKey: 'cronos-auth-token', // Nome da chave no LocalStorage
  },
});
