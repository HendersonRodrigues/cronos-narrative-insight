import { supabase } from "@/lib/supabase";
import type { ProfileType } from "@/types/cronos";

interface ProfileChangeEvent {
  session_id: string;
  from: ProfileType;
  to: ProfileType;
}

interface QueryEvent {
  session_id: string;
  profile: ProfileType;
  message: string;
}

/**
 * Loga troca de perfil em user_analytics.
 * Falha silenciosamente: se RLS bloquear ou tabela não existir, apenas warn no console.
 */
export async function logProfileChange(event: ProfileChangeEvent): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("user_analytics").insert({
      event_type: "profile_change",
      session_id: event.session_id,
      profile: event.to,
      payload: { from: event.from, to: event.to },
    });
    if (error) console.warn("[analytics] profile_change falhou:", error.message);
  } catch (err) {
    console.warn("[analytics] erro inesperado:", err);
  }
}

export async function logQuery(event: QueryEvent): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("user_analytics").insert({
      event_type: "consultoria_query",
      session_id: event.session_id,
      profile: event.profile,
      payload: { message: event.message },
    });
    if (error) console.warn("[analytics] query falhou:", error.message);
  } catch (err) {
    console.warn("[analytics] erro inesperado:", err);
  }
}
