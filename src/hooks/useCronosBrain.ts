import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SUPABASE_ANON_KEY } from "@/config/supabaseConfig";
import type { CronosBrainResponse, ProfileType } from "@/types/cronos";

interface BrainInput {
  message: string;
  profile: ProfileType;
  userId?: string; // Adicionado
}

const FRIENDLY_FALLBACK =
  "Não conseguimos processar sua análise no momento. Tente novamente em instantes.";

async function readEdgeErrorBody(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (!ctx || typeof ctx.clone !== "function") return null;
  try {
    const raw = await ctx.clone().text();
    return raw || null;
  } catch {
    return null;
  }
}

async function invokeBrain({ message, profile, userId }: BrainInput): Promise<CronosBrainResponse> {
  if (!supabase) throw new Error("Supabase não configurado");

  const userProfile = profile ?? "moderado";

  try {
    const { data, error } = await supabase.functions.invoke<CronosBrainResponse>(
      "cronos-brain",
      {
        body: { 
          prompt: message,
          userProfile: userProfile,
          userId: userId // ADICIONADO: Agora o ID viaja até a Edge Function
        },
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      },
    );

    if (error) {
      const raw = await readEdgeErrorBody(error);
      console.error("[cronos-brain] Falha na invocação:", error, "raw:", raw);

      // Tenta extrair mensagem amigável do payload retornado
      let friendly = FRIENDLY_FALLBACK;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.error === "string") friendly = parsed.error;
        } catch {
          /* corpo não-JSON, usa fallback */
        }
      }

      toast.error("Cronos indisponível", { description: friendly });
      throw new Error(friendly);
    }

    // Validação estrita do shape esperado: { answer: string }
    if (!data || typeof data.answer !== "string" || data.answer.trim().length === 0) {
      console.error("[cronos-brain] Resposta inválida:", data);
      toast.error("Resposta inválida", {
        description: "O motor retornou um formato inesperado.",
      });
      throw new Error("Resposta inválida");
    }

    return data;
  } catch (err) {
    // Garante que qualquer erro de rede/parse também seja tratado de forma amigável
    if (err instanceof Error && err.message !== "Resposta inválida") {
      console.error("[cronos-brain] Erro inesperado:", err);
    }
    throw err;
  }
}

export function useCronosBrain() {
  return useMutation({
    mutationFn: invokeBrain,
  });
}
