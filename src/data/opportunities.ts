export type OpportunityAccent = "gold" | "graphite" | "navy";

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  description: string;
  thesis: string;
  annualReturn: number; // % a.a.
  highlight: string; // ex: "18% a.a."
  riskLabel: string;
  horizon: string;
  accent: OpportunityAccent;
  // --- ADICIONE ESTES CAMPOS PARA A CALCULADORA ---
  minMonths: number;    // ex: 12
  maxMonths: number;    // ex: 36
  comparisonCDI: number; // ex: 1.5 (significa 150% do CDI)
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "consorcio-estruturado",
    title: "Consórcio Estruturado",
    category: "Renda Real Alavancada",
    description:
      "Estrutura de consórcio imobiliário com lance estratégico para multiplicar capital sem juros bancários.",
    thesis:
      "Aproveite a alavancagem do crédito coletivo para adquirir ativos reais valorizando acima da inflação, com saída programada e contemplação otimizada.",
    annualReturn: 18,
    highlight: "18% a.a.",
    riskLabel: "Risco Moderado",
    horizon: "24 a 60 meses",
    accent: "gold",
    minMonths: 24,
    maxMonths: 60,
    comparisonCDI: 1.6, // Exemplo: 160% do CDI
  },
  {
    id: "commodities-alpha",
    title: "Grupo de Investimento em Commodities",
    category: "Hedge Inflacionário",
    description:
      "Pool privado de exposição a commodities agrícolas e metais com gestão ativa e rebalanceamento mensal.",
    thesis:
      "Descorrelacionado da bolsa brasileira, protege capital em ciclos de alta do dólar e tensão geopolítica, capturando momentum de soft commodities.",
    annualReturn: 22,
    highlight: "22% a.a.",
    riskLabel: "Risco Moderado-Alto",
    horizon: "12 a 36 meses",
    accent: "graphite",
    minMonths: 12,
    maxMonths: 36,
    comparisonCDI: 1.4, // Exemplo: 160% do CDI
  },
  {
    id: "arbitragem-digital",
    title: "Arbitragem de Ativos Digitais",
    category: "Estratégia Quantitativa",
    description:
      "Operações de arbitragem entre exchanges com hedge cambial, sem exposição direcional ao preço do ativo.",
    thesis:
      "Captura ineficiências de preço entre mercados digitais com algoritmos proprietários, entregando retorno consistente em qualquer cenário macro.",
    annualReturn: 28,
    highlight: "28% a.a.",
    riskLabel: "Risco Calculado",
    horizon: "6 a 24 meses",
    accent: "navy",
    minMonths: 6,
    maxMonths: 24,
    comparisonCDI: 1.3, // Exemplo: 160% do CDI
  },
];

// Benchmarks anuais aproximados para comparação
export const BENCHMARKS = {
  cdi: 14.65,
  poupanca: 8.2,
};
