import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SUPABASE_ANON_KEY } from "@/config/supabaseConfig";
import type { CronosBrainResponse, ProfileType } from "@/types/cronos";

interface BrainInput {
  message: string;
  profile: ProfileType;
}

async function invokeBrain({ message, profile }: BrainInput): Promise<CronosBrainResponse> {
  if (!supabase) throw new Error("Supabase não configurado");

  // Garante que o header Authorization: Bearer <publishable key> seja enviado
  // explicitamente para a Edge Function (necessário com o novo formato sb_publishable_*).
  const { data, error } = await supabase.functions.invoke<CronosBrainResponse>("cronos-brain", {
    body: { message, profile },
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (error) {
    // Expõe o erro técnico real no console para debug
    console.error("[cronos-brain] Falha na invocação:", error);
    // Tenta extrair o body de resposta da função (quando disponível)
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const raw = await ctx.clone().text();
        console.error("[cronos-brain] Resposta bruta da Edge Function:", raw);
        throw new Error(`Edge function ${ctx.status}: ${raw || error.message}`);
      } catch (parseErr) {
        console.error("[cronos-brain] Erro ao ler body da resposta:", parseErr);
      }
    }
    throw error;
  }
  if (!data) throw new Error("Resposta vazia do Cronos");
  return data;
}

export function useCronosBrain() {
  return useMutation({
    mutationFn: invokeBrain,
  });
}
