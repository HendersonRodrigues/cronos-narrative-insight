import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MarketDataPoint } from "@/types/cronos";
import {
  logIntegrationEvent,
  reportIntegrationError,
} from "@/services/integrationHealth";

/**
 * BUSCA 1: Feed Geral (Lightweight)
 * Traz apenas os registros mais recentes de todos os ativos para alimentar
 * os mini-cards de preço e variações na Home.
 */
async function fetchMarketFeed(): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  
  // Buscamos um limite seguro para garantir que pegamos os últimos pontos 
  // de todos os ativos sem sobrecarregar o buffer inicial.
  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1500); 

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
 * Traz o histórico de um ativo específico sob demanda.
 * - Para Selic: filtra últimos 10 anos (desde 2016) e agrega por mês
 * - Para outros ativos: traz histórico completo com filtro temporal
 * Usado exclusivamente pelo MarketChart para análise de longo prazo.
 */
async function fetchAssetHistory(assetId: string): Promise<MarketDataPoint[]> {
  if (!supabase) throw new Error("Supabase não configurado");
  if (!assetId) return [];

  // Definir data de corte: 10 anos atrás (desde 2016)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const cutoffDate = tenYearsAgo.toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .eq("asset_id", assetId)
    .gte("date", cutoffDate) // Apenas últimos 10 anos
    .order("date", { ascending: true });

  if (error) {
    console.error(`Erro ao buscar histórico do ativo ${assetId}:`, error.message);
    throw error;
  }

  const allData = (data as MarketDataPoint[] | null) ?? [];

  // Para Selic, agregar por mês (pegar valor do último dia do mês)
  if (assetId === "selic" && allData.length > 0) {
    const monthlyData: Record<string, MarketDataPoint> = {};

    for (const point of allData) {
      // Extrair ano-mês (YYYY-MM)
      const dateStr = point.date.substring(0, 7);
      // Guardar o último ponto de cada mês
      monthlyData[dateStr] = point;
    }

    // Converter de volta para array ordenado
    return Object.values(monthlyData).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  return allData;
}

// Hook para o Feed da Home (Cards)
export function useMarketFeed() {
  return useQuery({
    queryKey: ["market_data", "feed"],
    queryFn: fetchMarketFeed,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para o Histórico do Gráfico (Buffer / Cache)
export function useAssetHistory(assetId: string | null) {
  return useQuery({
    queryKey: ["market_data", "history", assetId],
    queryFn: () => fetchAssetHistory(assetId!),
    enabled: !!assetId, // Só dispara se houver um ID selecionado
    staleTime: 1000 * 60 * 30, // 30 minutos (Buffer em memória)
    gcTime: 1000 * 60 * 60, // Mantém no "cache de lixo" por 1 hora
    refetchOnWindowFocus: false,
  });
}
