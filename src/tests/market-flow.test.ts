// src/tests/market-flow.test.ts

import { supabase } from "@/lib/supabase";

export const testMarketDataFlow = async () => {
  const results = {
    step1_connection: { status: "pending", detail: "" },
    step2_market_data_raw: { status: "pending", detail: "" },
    step3_snapshots_table: { status: "pending", detail: "" },
    step4_specific_asset: { status: "pending", detail: "" },
  };

  try {
    // ESTAÇÃO 1: Conexão básica
    const { data: conn, error: err1 } = await supabase.from('market_data').select('count', { count: 'exact', head: true });
    if (err1) throw new Error(`Erro 403 ou conexão: ${err1.message}`);
    results.step1_connection = { status: "success", detail: `Conectado. Total linhas: ${conn}` };

    // ESTAÇÃO 2: Verificação de datas recentes (2026)
    const { data: raw, error: err2 } = await supabase
      .from('market_data')
      .select('date')
      .order('date', { ascending: false })
      .limit(1);
    results.step2_market_data_raw = { status: "success", detail: `Último dado bruto em: ${raw?.[0]?.date}` };

    // ESTAÇÃO 3: Tabela de Snapshots (onde o 403 costuma ocorrer)
    const { data: snap, error: err3 } = await supabase
      .from('market_analytics_snapshots')
      .select('asset_id, period_group')
      .limit(1);
    if (err3) {
       results.step3_snapshots_table = { status: "error", detail: `BLOQUEIO RLS: ${err3.message}` };
    } else {
       results.step3_snapshots_table = { status: "success", detail: `Acesso OK. Snapshots encontrados.` };
    }

    // ESTAÇÃO 4: Teste de Integridade do JSON (Object.keys)
    const { data: fullSnap, error: err4 } = await supabase
      .from('market_analytics_snapshots')
      .select('data_points')
      .eq('asset_id', 'selic')
      .eq('period_group', 'short')
      .single();

    if (fullSnap?.data_points) {
      const keys = Object.keys(fullSnap.data_points[0] || {});
      results.step4_specific_asset = { status: "success", detail: `Estrutura JSON OK. Chaves: ${keys.join(',')}` };
    }

  } catch (e: any) {
    console.error("Falha no teste de fluxo:", e);
  }

  return results;
};
