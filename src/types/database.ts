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

export interface AppQuestionRow {
  id: string;
  text: string;
  is_active: boolean;
  category: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string | null;
}

export type AppQuestionInsert = Omit<
  AppQuestionRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string | null;
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
  category: string | null;
  min_investment: number | null;
  created_at: string;
  updated_at: string | null;
}

export type InvestmentOpportunityInsert = Omit<
  InvestmentOpportunityRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string | null;
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
