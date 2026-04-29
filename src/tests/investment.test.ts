// Simulação das funções que estão no seu código
const extractMinMonths = (horizon: string): number => {
  const match = horizon.match(/\d+/);
  return match ? parseInt(match[0], 10) : 12;
};

const calculateReturn = (principal: number, annualRate: number, months: number) => {
  const monthlyRate = (annualRate / 100) / 12;
  return principal + (principal * monthlyRate * months);
};

// SUITE DE TESTES ALFA
export const runInvestmentTests = () => {
  console.group("🧪 Testes Alfa: Lógica de Investimento");

  // Teste 1: Extração de Prazo
  const t1 = extractMinMonths("12 - 36 meses") === 12;
  const t2 = extractMinMonths("24 meses") === 24;
  const t3 = extractMinMonths("Sem prazo") === 12; // fallback
  console.log(t1 && t2 && t3 ? "✅ Extração de Horizonte: OK" : "❌ Extração de Horizonte: FALHOU");

  // Teste 2: Precisão Matemática
  // R$ 1000 a 12% a.a por 12 meses deve dar R$ 1120 (juros simples como no seu card)
  const result = calculateReturn(1000, 12, 12);
  console.log(result === 1120 ? "✅ Cálculo de Retorno: OK" : `❌ Cálculo de Retorno: FALHOU (Recebeu: ${result})`);

  console.groupEnd();
};
