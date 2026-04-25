/**
 * useAdminContent — hooks de leitura/escrita para o painel admin.
 *
 * Encapsula loading/erro e revalidação após mutações.
 */

import { useCallback, useEffect, useState } from "react";
import {
  listQuestions,
  createQuestion,
  toggleQuestionActive,
  deleteQuestion,
  listOpportunities,
  createOpportunity,
  toggleOpportunityActive,
} from "@/services/adminService";
import type {
  AppQuestionRow,
  AppQuestionInsert,
  InvestmentOpportunityRow,
  InvestmentOpportunityInsert,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export function useAdminQuestions() {
  const [data, setData] = useState<AppQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listQuestions());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (payload: AppQuestionInsert) => {
      await createQuestion(payload);
      await refresh();
    },
    [refresh],
  );

  const toggle = useCallback(
    async (id: string, isActive: boolean) => {
      await toggleQuestionActive(id, isActive);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteQuestion(id);
      await refresh();
    },
    [refresh],
  );

  return { data, loading, error, refresh, add, toggle, remove };
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export function useAdminOpportunities() {
  const [data, setData] = useState<InvestmentOpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listOpportunities());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (payload: InvestmentOpportunityInsert) => {
      await createOpportunity(payload);
      await refresh();
    },
    [refresh],
  );

  const toggle = useCallback(
    async (id: string, isActive: boolean) => {
      await toggleOpportunityActive(id, isActive);
      await refresh();
    },
    [refresh],
  );

  return { data, loading, error, refresh, add, toggle };
}
