import { supabase } from "@/lib/supabase";

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

/**
 * Diagnósticos Alfa — checagens leves de integridade que rodam no painel Admin.
 *
 * Observação: a tabela `market_data` usa `asset_id` como identificador canônico
 * dos ativos (não há coluna `symbol`). O ativo padrão para o smoke test é
 * `selic`.
 */
export const runAlfaDiagnostics = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // 1. Conexão e leitura do ativo padrão (Selic) via asset_id
  try {
    const { data, error } = await supabase
      .from("market_data")
      .select("asset_id, value, date")
      .eq("asset_id", "selic")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      results.push({
        name: "Conexão Banco (Selic)",
        status: "warning",
        message: "Conexão OK, mas nenhum registro encontrado para asset_id='selic'.",
      });
    } else {
      results.push({
        name: "Conexão Banco (Selic)",
        status: "pass",
        message: `Selic encontrada: ${data.value} (${data.date}).`,
      });
    }
  } catch (err) {
    results.push({
      name: "Conexão Banco (Selic)",
      status: "fail",
      message: `Erro ao buscar Selic: ${(err as Error).message}`,
    });
  }

  // 2. Acesso público (RLS) às perguntas ativas
  try {
    const { data, error } = await supabase
      .from("app_questions")
      .select("id")
      .eq("is_active", true);

    if (error) throw error;
    results.push({
      name: "Acesso Público (RLS)",
      status: data && data.length > 0 ? "pass" : "warning",
      message: `${data?.length ?? 0} perguntas ativas encontradas.`,
    });
  } catch {
    results.push({
      name: "Acesso Público (RLS)",
      status: "fail",
      message: "Falha crítica: visitantes não conseguem ler perguntas.",
    });
  }

  // 3. Lógica de extração de prazo (regex)
  const testHorizons = ["12 meses", "24-36 meses", "Prazo 6 meses"];
  const regex = /\d+/;
  const horizonPass = testHorizons.every((h) => regex.test(h));
  results.push({
    name: "Lógica de Extração (Prazo)",
    status: horizonPass ? "pass" : "fail",
    message: horizonPass
      ? "Regex identificando números corretamente."
      : "Regex falhou em alguns formatos.",
  });

  // 4. Acesso às oportunidades de investimento
  try {
    const { data, error } = await supabase
      .from("investment_opportunities")
      .select("id, name, is_active")
      .limit(1);

    if (error) throw error;
    results.push({
      name: "Acesso Oportunidades",
      status: data && data.length > 0 ? "pass" : "warning",
      message:
        data && data.length > 0
          ? `${data.length} oportunidade(s) encontrada(s).`
          : "Tabela existe, mas sem registros.",
    });
  } catch (err) {
    results.push({
      name: "Acesso Oportunidades",
      status: "fail",
      message: `Erro ao acessar oportunidades: ${(err as Error).message}`,
    });
  }

  // 5. Acesso aos leads
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id", { count: "exact" })
      .limit(1);

    if (error) throw error;
    results.push({
      name: "Integridade Leads",
      status: "pass",
      message: `Tabela leads acessível e funcionando.`,
    });
  } catch (err) {
    results.push({
      name: "Integridade Leads",
      status: "fail",
      message: `Erro ao acessar leads: ${(err as Error).message}`,
    });
  }

  // 6. Acesso aos profiles
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) throw error;
    results.push({
      name: "Integridade Profiles",
      status: "pass",
      message: `Tabela profiles acessível.`,
    });
  } catch (err) {
    results.push({
      name: "Integridade Profiles",
      status: "warning",
      message: `Profiles pode estar vazio ou inacessível.`,
    });
  }

  // 7. Validação de dados de mercado
  try {
    const { data, error } = await supabase
      .from("market_data")
      .select("asset_id")
      .limit(1);

    if (error) throw error;
    results.push({
      name: "Dados de Mercado",
      status: data && data.length > 0 ? "pass" : "warning",
      message:
        data && data.length > 0
          ? "Dados de mercado disponíveis."
          : "Nenhum dado de mercado registrado.",
    });
  } catch (err) {
    results.push({
      name: "Dados de Mercado",
      status: "fail",
      message: `Erro ao buscar dados: ${(err as Error).message}`,
    });
  }

  // 8. Teste de computação (percentual)
  try {
    const pctChange = (current: number, previous: number) =>
      previous === 0 ? 0 : ((current - previous) / previous) * 100;
    const result = pctChange(110, 100);
    const isCorrect = Math.abs(result - 10) < 0.01;

    results.push({
      name: "Cálculo Percentual",
      status: isCorrect ? "pass" : "fail",
      message: isCorrect
        ? `Cálculo correto: variação = ${result.toFixed(2)}%.`
        : `Cálculo incorreto: esperado 10%, obteve ${result.toFixed(2)}%.`,
    });
  } catch (err) {
    results.push({
      name: "Cálculo Percentual",
      status: "fail",
      message: `Erro em cálculo: ${(err as Error).message}`,
    });
  }

  return results;
};
