import type { Asset, MarketRegime, RiskLevel, TimelineEvent } from "@/data/mockData";

export interface NarrativeRow {
  id: string;
  asset_id: string;
  title: string;
  content_historical: string;
  content_weekly: string;
  market_regime: string;
  gap_curiosity: string | null;
  cta_text: string;
  cta_link: string;
  question_past_rhyme: string | null;
  question_tug_of_war: string | null;
  question_realistic_view: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MappedAssetData {
  asset: Asset;
  title: string;
  narrative: string;
  curiosityGap?: string;
  regime: MarketRegime;
  regimeColor: "risk-off" | "risk-on" | "caution";
  action: {
    title: string;
    description: string;
    riskLevel: RiskLevel;
    ctaLabel: string;
    ctaUrl: string;
  };
  timeline: TimelineEvent[];
  lastUpdate: string;
  questions: {
    pastRhyme: string | null;
    tugOfWar: string | null;
    realisticView: string | null;
  };
}
