/**
 * Tipos TypeScript sincronizados manualmente com o schema do banco.
 *
 * Cobre as tabelas/funções do projeto:
 *   - enum public.app_role
 *   - tabela public.user_roles
 *   - tabela public.app_questions          (perguntas dinâmicas do app)
 *   - tabela public.investment_opportunities (oportunidades de diversificação)
 *   - função public.has_role(_user_id uuid, _role app_role) returns boolean
 *
 * Use estes tipos como genéricos ao chamar `supabase.from(...)` /
 * `supabase.rpc(...)` para obter autocomplete e segurança de tipos.
 */

// ---------------------------------------------------------------------------
// profiles — dados cadastrais do usuário (metadados)
// ---------------------------------------------------------------------------

export interface ProfileDataRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  role?: string | null;
  risk_profile?: string | null;
  interests?: string[] | null;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type AppRole = "admin" | "moderator" | "user";

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface HasRoleArgs {
  _user_id: string;
  _role: AppRole;
}

// ---------------------------------------------------------------------------
// app_questions — perguntas dinâmicas exibidas no app (ex.: consultoria/onboarding)
// ---------------------------------------------------------------------------

export type ContentStatus = "draft" | "published" | "archived";

export interface AppQuestionRow {
  id: string;
  text: string;
  is_active: boolean;
  status: ContentStatus | string;
  category: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string | null;
}

export type AppQuestionInsert = Omit<
  AppQuestionRow,
  "id" | "created_at" | "updated_at" | "status"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string | null;
  status?: ContentStatus | string;
};

// ---------------------------------------------------------------------------
// investment_opportunities — oportunidades estratégicas exibidas em /oportunidades
// ---------------------------------------------------------------------------

export type RiskLevel = "baixo" | "medio" | "alto";

export interface InvestmentOpportunityRow {
  id: string;
  name: string;
  description: string | null;
  return_rate: number | null;     // ex.: 0.18 (18% a.a.)
  risk_level: RiskLevel | string; // string p/ tolerar valores não enumerados
  is_active: boolean;
  is_archived: boolean;
  status: ContentStatus | string;
  category: string | null;
  min_investment: number | null;
  horizon: string | null;
  summary: string | null;
  details_content: string | null;
  deep_analysis: string | null;
  assets_linked: string[] | null;
  author_id: string | null;
  created_at: string;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// daily_briefing — análises macro/diárias publicadas pelo admin
// ---------------------------------------------------------------------------

export interface DailyBriefingRow {
  id: string;
  created_at: string;
  date: string | null;
  title: string | null;
  content: string | null;
  profile_type: string | null;
  status: ContentStatus | string;
  market_sentiment: string | null;
  trade_setup: string | null;
  details_content: string | null;
  deep_analysis: string | null;
  assets_linked: string[] | null;
  author_id: string | null;
}

export type DailyBriefingInsert = Omit<DailyBriefingRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type InvestmentOpportunityInsert = Omit<
  InvestmentOpportunityRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "status"
  | "is_archived"
  | "summary"
  | "details_content"
  | "deep_analysis"
  | "assets_linked"
  | "author_id"
  | "category"
  | "min_investment"
  | "horizon"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string | null;
  status?: ContentStatus | string;
  is_archived?: boolean;
  category?: string | null;
  min_investment?: number | null;
  horizon?: string | null;
  summary?: string | null;
  details_content?: string | null;
  deep_analysis?: string | null;
  assets_linked?: string[] | null;
  author_id?: string | null;
};

// ---------------------------------------------------------------------------
// RPCs
// ---------------------------------------------------------------------------

export interface DatabaseRpc {
  has_role: {
    Args: HasRoleArgs;
    Returns: boolean;
  };
}
