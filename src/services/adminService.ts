/**
 * adminService — operações CRUD para conteúdo administrável da Cronos.
 *
 * Tabelas:
 *  - public.app_questions
 *  - public.investment_opportunities
 *
 * Todas as operações usam o cliente `supabase` autenticado. As policies de RLS
 * garantem que apenas usuários com role `admin` consigam escrever.
 */

import { supabase } from "@/lib/supabase";
import type {
  AppQuestionRow,
  AppQuestionInsert,
  InvestmentOpportunityRow,
  InvestmentOpportunityInsert,
} from "@/types/database";

// ---------------------------------------------------------------------------
// app_questions
// ---------------------------------------------------------------------------

export async function listQuestions(opts?: {
  onlyActive?: boolean;
}): Promise<AppQuestionRow[]> {
  if (!supabase) return [];
  let query = supabase
    .from("app_questions")
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (opts?.onlyActive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AppQuestionRow[];
}

export async function createQuestion(
  payload: AppQuestionInsert,
): Promise<AppQuestionRow> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("app_questions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AppQuestionRow;
}

export async function toggleQuestionActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("app_questions")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("app_questions").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// investment_opportunities
// ---------------------------------------------------------------------------

export async function listOpportunities(opts?: {
  onlyActive?: boolean;
}): Promise<InvestmentOpportunityRow[]> {
  if (!supabase) return [];
  let query = supabase
    .from("investment_opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.onlyActive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InvestmentOpportunityRow[];
}

export async function createOpportunity(
  payload: InvestmentOpportunityInsert,
): Promise<InvestmentOpportunityRow> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("investment_opportunities")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as InvestmentOpportunityRow;
}

export async function toggleOpportunityActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("investment_opportunities")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateOpportunity(
  id: string,
  patch: Partial<InvestmentOpportunityRow>,
): Promise<InvestmentOpportunityRow> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("investment_opportunities")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as InvestmentOpportunityRow;
}

export async function deleteOpportunity(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("investment_opportunities")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
