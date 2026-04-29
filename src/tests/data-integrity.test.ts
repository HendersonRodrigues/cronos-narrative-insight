import { supabase } from "@/lib/supabase";

export const runDataIntegrityTests = async () => {
  console.group("🧪 Testes Alfa: Integridade de Dados");

  // Teste 1: Selic disponível
  const { data: selic } = await supabase.from('market_data').select('value').eq('symbol', 'selic').single();
  console.log(selic ? `✅ Selic encontrada: ${selic.value}%` : "❌ Selic não encontrada no banco!");

  // Teste 2: Perguntas para deslogados
  const { data: questions, error } = await supabase.from('app_questions').select('text').eq('is_active', true);
  if (error) {
    console.log("❌ Erro ao buscar perguntas (pode ser RLS):", error.message);
  } else {
    console.log(questions.length > 0 ? `✅ Perguntas públicas: ${questions.length} encontradas` : "⚠️ Nenhuma pergunta ativa no banco.");
  }

  console.groupEnd();
};
