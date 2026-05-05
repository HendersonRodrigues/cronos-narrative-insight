import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MarketDataPoint } from "@/types/cronos";
import {
  logIntegrationEvent,
  reportIntegrationError,
} from "@/services/integrationHealth";

const HISTORY_START_DATE = "2015-01-01";

/**
 * BUSCA 1: Feed Geral (Lightweight)
 * Traz apenas os registros mais recentes para os mini-cards da Home.
 */
async function fetchMarketFeed(): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  
  // Aumentamos para 2500 para garantir que pegamos os dados recentes de todos os ativos
  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(2500); 

  if (error) {
    void reportIntegrationError("market_data", error, {
      status_code: (error as { status?: number }).status ?? null,
      context: { hint: "fetch market feed" },
    });
    throw error;
  }

  const rows = (data as MarketDataPoint[] | null) ?? [];
  if (rows.length > 0) {
    void logIntegrationEvent({
      service_name: "market_data",
      status: "ok",
      context: { rows: rows.length },
    });
  }
  return rows;
}

/**
 * BUSCA 2: Histórico Profundo por Ativo (Lazy Loading)
 * Traz o histórico de um ativo específico sob demanda desde 2015.
 */
async function fetchAssetHistory(assetId: string): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  if (!assetId) return [];

  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .eq("asset_id", assetId)
    .gte("date", HISTORY_START_DATE)
    .order("date", { ascending: true });

  if (error) {
    console.error(`Erro ao buscar histórico do ativo ${assetId}:`, error.message);
    throw error;
  }

  const allData = (data as MarketDataPoint[] | null) ?? [];

  // CORREÇÃO SELIC: Removemos a agregação mensal agressiva.
  // Mantemos todos os pontos onde houve mudança de valor para desenhar os degraus.
  if (assetId === "selic") {
    return allData.filter((point, index, self) => 
      index === 0 || point.value !== self[index - 1].value || point.date !== self[index - 1].date
    );
  }

  return allData;
}

// Hook para o Feed da Home (Cards)
export function useMarketFeed() {
  return useQuery({
    queryKey: ["market_data", "feed"],
    queryFn: fetchMarketFeed,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

// Hook para o Histórico do Gráfico (Buffer / Cache)
export function useAssetHistory(assetId: string | null) {
  return useQuery({
    queryKey: ["market_data", "history", assetId],
    queryFn: () => fetchAssetHistory(assetId!),
    enabled: !!assetId,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}
