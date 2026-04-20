import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MarketDataPoint } from "@/types/cronos";

async function fetchMarketFeed(): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1500);
  if (error) throw error;
  return (data as MarketDataPoint[] | null) ?? [];
}

export function useMarketFeed() {
  return useQuery({
    queryKey: ["market_data", "feed"],
    queryFn: fetchMarketFeed,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
