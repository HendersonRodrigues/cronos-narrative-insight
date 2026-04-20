import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DailyBriefing } from "@/types/cronos";

async function fetchLatestBriefing(): Promise<DailyBriefing | null> {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase
    .from("daily_briefing")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as DailyBriefing | null) ?? null;
}

export function useDailyBriefing() {
  return useQuery({
    queryKey: ["daily_briefing", "latest"],
    queryFn: fetchLatestBriefing,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
