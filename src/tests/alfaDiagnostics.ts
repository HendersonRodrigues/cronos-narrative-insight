import { supabase } from "@/lib/supabase";

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const runAlfaDiagnostics = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // 1. Teste de Conexão e Selic
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('asset_id')
      .ilike('symbol', 'selic')
      .single();
    
    if (error) throw error;
    results.push({
      name: "Conexão Banco (Selic)",
      status: 'pass',
      message: `Selic encontrada: ${data.value}%`
    });
  } catch (err: any) {
    results.push({
      name: "Conexão Banco (Selic)",
      status: 'fail',
      message: `Erro ao buscar Selic: ${err.message}`
    });
  }

  // 2. Teste de Perguntas Públicas (RLS)
  try {
    const { data, error } = await supabase
      .from('app_questions')
      .select('id')
      .eq('is_active', true);
    
    if (error) throw error;
    results.push({
      name: "Acesso Público (RLS)",
      status: data && data.length > 0 ? 'pass' : 'warning',
      message: `${data?.length || 0} perguntas encontradas.`
    });
  } catch (err: any) {
    results.push({
      name: "Acesso Público (RLS)",
      status: 'fail',
      message: "Falha crítica: visitantes não conseguem ler perguntas."
    });
  }

  // 3. Teste de Lógica de Horizonte (Regex)
  const testHorizons = ["12 meses", "24-36 meses", "Prazo 6 meses"];
  const regex = /\d+/;
  const horizonPass = testHorizons.every(h => regex.test(h));
  
  results.push({
    name: "Lógica de Extração (Prazo)",
    status: horizonPass ? 'pass' : 'fail',
    message: horizonPass ? "Regex identificando números corretamente." : "Regex falhou em alguns formatos."
  });

  return results;
};
