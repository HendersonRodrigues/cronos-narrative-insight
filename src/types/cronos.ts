export type ProfileType = "conservador" | "moderado" | "agressivo";

export interface DailyBriefing {
  id: string;
  created_at: string;
  date: string;
  title: string;
  content: string;
  profile_type: string;
  status?: string;
  market_sentiment?: string | null;
  trade_setup?: string | null;
  details_content?: string | null;
  deep_analysis?: string | null;
  assets_linked?: string[] | null;
}

export interface MarketDataPoint {
  id: number;
  asset_id: string;
  date: string;
  value: number;
  meta: Record<string, unknown> | null;
}

export interface CronosBrainResponse {
  answer: string;
  [key: string]: unknown;
}
