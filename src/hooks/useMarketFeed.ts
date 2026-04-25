import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MarketDataPoint } from "@/types/cronos";
import {
  logIntegrationEvent,
  reportIntegrationError,
} from "@/services/integrationHealth";

async function fetchMarketFeed(): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1200);

  if (error) {
    // Registra falha de integração antes de propagar
    void reportIntegrationError("market_data", error, {
      status_code: (error as { status?: number }).status ?? null,
      context: { hint: "fetch market feed" },
    });
    throw error;
  }

  const rows = (data as MarketDataPoint[] | null) ?? [];
  // Marca sucesso quando há leitura válida (assim o badge volta a verde)
  if (rows.length > 0) {
    void logIntegrationEvent({
      service_name: "market_data",
      status: "ok",
      context: { rows: rows.length },
    });
  }
  return rows;
}

export function useMarketFeed() {
  return useQuery({
    queryKey: ["market_data", "feed"],
    queryFn: fetchMarketFeed,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
