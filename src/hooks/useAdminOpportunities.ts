import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Opportunity } from "@/data/opportunities";
import type { RiskLevel } from "@/types/database";

interface AdminOpportunity extends Opportunity {
  id: string;
  is_active: boolean;
}

export function useAdminOpportunities() {
  const [data, setData] = useState<AdminOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca todas as oportunidades do Supabase
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const { data: opportunities, error } = await supabase
          .from("investment_opportunities")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setData(opportunities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar oportunidades");
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Cria uma nova oportunidade
  const add = async (opportunity: Omit<AdminOpportunity, "id">) => {
  try {
    const { data: newOpportunity, error } = await supabase
      .from("investment_opportunities")
      .insert([{
        name: opportunity.name,
        description: opportunity.description,
        return_rate: opportunity.return_rate,
        risk_level: opportunity.risk_level,
        is_active: opportunity.is_active ?? true,
      }])
      .select()
      .single();

      if (error) throw error;
      setData([newOpportunity, ...data]);
      return newOpportunity;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Falha ao criar oportunidade");
    }
  };

  // Atualiza uma oportunidade (inclui toggle de ativo/inativo)
  const update = async (id: string, updates: Partial<AdminOpportunity>) => {
    try {
      const { data: updatedOpportunity, error } = await supabase
        .from("investment_opportunities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setData(data.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
      return updatedOpportunity;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Falha ao atualizar oportunidade");
    }
  };

  // Deleta uma oportunidade
  const remove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("investment_opportunities")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setData(data.filter((opp) => opp.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Falha ao deletar oportunidade");
    }
  };

  // Alterna o status ativo/inativo
  const toggle = async (id: string, isActive: boolean) => {
    await update(id, { is_active: isActive });
  };

  return { data, loading, error, add, update, remove, toggle };
}
