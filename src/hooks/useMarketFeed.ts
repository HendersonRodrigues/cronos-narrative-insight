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
async function fetchAssetHistory(assetId: string): Promise<MarketDataPoint[]> {
  if (!supabase || !assetId) return [];

  const { data, error } = await supabase
    .from("market_data")
    .select("*")
    .eq("asset_id", assetId)
    .gte("date", HISTORY_START_DATE)
    .order("date", { ascending: true });

  if (error) throw error;
  const allData = (data as MarketDataPoint[] | null) ?? [];

  // CORREÇÃO SELIC: Não agregue por mês! 
  // O gráfico precisa de todos os pontos onde a taxa mudou para desenhar o degrau.
  // Só filtramos duplicados na mesma data.
  if (assetId === "selic") {
    return allData.filter((point, index, self) => 
      index === 0 || point.value !== self[index - 1].value || point.date !== self[index - 1].date
    );
  }

  return allData;
}

const HISTORY_START_DATE = "2015-01-01";

/**
 * BUSCA 2: Histórico Profundo por Ativo (Lazy Loading)
 * Traz o histórico de um ativo específico sob demanda desde 2015.
 * - Para Selic diária muito densa: agrega por mês para preservar fluidez
 * - Para séries esparsas: preserva todos os pontos reais
 * Usado exclusivamente pelo MarketChart para análise de longo prazo.
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

  // Se a Selic vier diária, agrega por mês; se vier apenas nos eventos de
  // alteração da taxa, mantém todos os pontos para não distorcer períodos.
  if (assetId === "selic" && allData.length > 240) {
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
