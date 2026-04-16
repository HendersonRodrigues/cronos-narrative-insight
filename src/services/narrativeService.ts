import { supabase } from "@/lib/supabase";
import type { NarrativeRow, MappedAssetData } from "@/types/narrative";
import { mockData, type Asset, type MarketRegime } from "@/data/mockData";

const regimeMap: Record<string, { regime: MarketRegime; color: "risk-off" | "risk-on" | "caution" }> = {
  "risk-off": { regime: "Risk-Off", color: "risk-off" },
  "risk-on": { regime: "Risk-On", color: "risk-on" },
  "bull": { regime: "Bull Market", color: "risk-on" },
  "bear": { regime: "Bear Market", color: "risk-off" },
  "neutro": { regime: "Neutro", color: "caution" },
  "caution": { regime: "Neutro", color: "caution" },
};

function mapRowToAssetData(row: NarrativeRow, asset: Asset): MappedAssetData {
  const fallback = mockData[asset];
  const regimeInfo = regimeMap[row.market_regime?.toLowerCase()] ?? { regime: row.market_regime as MarketRegime, color: "caution" as const };

  return {
    asset: row.asset_id as Asset,
    title: row.title,
    narrative: `${row.content_historical} ${row.content_weekly}`.trim(),
    curiosityGap: row.gap_curiosity ?? undefined,
    regime: regimeInfo.regime,
    regimeColor: regimeInfo.color,
    action: {
      title: row.cta_text,
      description: fallback.action.description,
      riskLevel: fallback.action.riskLevel,
      ctaLabel: row.cta_text,
      ctaUrl: row.cta_link,
    },
    timeline: fallback.timeline,
    lastUpdate: new Date().toLocaleDateString("pt-BR", {
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

export async function fetchNarrativeByAsset(assetId: Asset): Promise<MappedAssetData | null> {
  if (!supabase) {
    console.info("Supabase não configurado. Usando mock data.");
    return null;
  }

  const { data, error } = await supabase
    .from("narratives")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Erro ao buscar narrativa:", error.message);
    return null;
  }

  return mapRowToAssetData(data as NarrativeRow, assetId);
}
