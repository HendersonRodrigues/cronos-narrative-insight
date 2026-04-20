import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CronosBrainResponse, ProfileType } from "@/types/cronos";

interface BrainInput {
  message: string;
  profile: ProfileType;
}

async function invokeBrain({ message, profile }: BrainInput): Promise<CronosBrainResponse> {
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.functions.invoke<CronosBrainResponse>("cronos-brain", {
    body: { message, profile },
  });

  if (error) throw error;
  if (!data) throw new Error("Resposta vazia do Cronos");
  return data;
}

export function useCronosBrain() {
  return useMutation({
    mutationFn: invokeBrain,
  });
}
