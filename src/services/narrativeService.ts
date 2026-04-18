import { supabase } from "@/lib/supabase";
import type { NarrativeRow, MappedAssetData } from "@/types/narrative";
import { mockData, type Asset, type MarketRegime } from "@/data/mockData";

// Mapeamento de estilos visuais baseados no regime de mercado
const regimeMap: Record<string, { regime: MarketRegime; color: "risk-off" | "risk-on" | "caution" }> = {
  "risk-off": { regime: "Risk-Off", color: "risk-off" },
  "risk-on": { regime: "Risk-On", color: "risk-on" },
  "bull": { regime: "Bull Market", color: "risk-on" },
  "bear": { regime: "Bear Market", color: "risk-off" },
  "neutro": { regime: "Neutro", color: "caution" },
  "caution": { regime: "Neutro", color: "caution" },
};

/**
 * Transforma o dado bruto do banco/IA no formato que o Frontend (Lovable) espera.
 */
function mapRowToAssetData(row: NarrativeRow, asset: Asset): MappedAssetData {
  const fallback = mockData[asset];
  const regimeKey = row.market_regime?.toLowerCase() || "neutro";
  const regimeInfo = regimeMap[regimeKey] ?? { 
    regime: row.market_regime as MarketRegime, 
    color: "caution" as const 
  };

  return {
    asset: row.asset_id as Asset,
    title: row.title,
    narrative: `${row.content_historical}\n\n${row.content_weekly}`.trim(),
    curiosityGap: row.gap_curiosity ?? undefined,
    regime: regimeInfo.regime,
    regimeColor: regimeInfo.color,
    action: {
      title: row.cta_text || fallback.action.title,
      description: fallback.action.description,
      riskLevel: fallback.action.riskLevel,
      ctaLabel: row.cta_text || fallback.action.ctaLabel,
      ctaUrl: row.cta_link || fallback.action.ctaUrl,
    },
    timeline: fallback.timeline,
    lastUpdate: new Date(row.created_at || new Date()).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    questions: {
      pastRhyme: row.question_past_rhyme,
      tugOfWar: row.question_tug_of_war,
      realisticView: row.question_realistic_view,
    },
  };
}

/**
 * Busca narrativa no banco (Cache) ou gera uma nova via Edge Function (Cronos Brain).
 */
export async function fetchNarrativeByAsset(assetId: Asset, queryText: string = "Análise geral de mercado"): Promise<MappedAssetData | null> {
  if (!supabase) {
    console.error("Supabase client não inicializado.");
    return null;
  }

  try {
    // 1. Tenta buscar análise válida no cache (narrativa que não expirou)
    const { data: cachedData, error: fetchError } = await supabase
      .from("narratives")
      .select("*")
      .eq("asset_id", assetId)
      .gt("expires_at", new Date().toISOString()) // Regra de negócio: apenas dados não expirados
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedData) {
      console.log(`[Cronos Service] Cache hit para ${assetId}`);
      return mapRowToAssetData(cachedData as NarrativeRow, assetId);
    }

    // 2. Cache miss ou expirado: Invoca a Edge Function "cronos-brain"
    console.log(`[Cronos Service] Cache miss/expirado para ${assetId}. Acionando Edge Function...`);
    
    const { data: generatedData, error: funcError } = await supabase.functions.invoke('cronos-brain', {
      body: { 
        asset_id: assetId, 
        query_text: queryText 
      }
    });

    if (funcError || !generatedData) {
      console.error("[Cronos Service] Erro ao invocar cérebro:", funcError);
      // Fallback para mock data em caso de falha crítica na IA para não quebrar a UI
      return null;
    }

    console.log(`[Cronos Service] Nova narrativa gerada com sucesso para ${assetId}`);
    return mapRowToAssetData(generatedData as NarrativeRow, assetId);

  } catch (err) {
    console.error("[Cronos Service] Erro inesperado na camada de serviço:", err);
    return null;
  }
}
