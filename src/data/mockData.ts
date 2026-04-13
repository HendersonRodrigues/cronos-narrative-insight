export type Asset = "IBOV" | "DOLAR" | "SELIC" | "IPCA";

export type MarketRegime = "Risk-Off" | "Risk-On" | "Bull Market" | "Bear Market" | "Neutro";

export type RiskLevel = "alto" | "moderado" | "baixo";

export interface AssetData {
  asset: Asset;
  title: string;
  narrative: string;
  regime: MarketRegime;
  regimeColor: "risk-off" | "risk-on" | "caution";
  action: {
    title: string;
    description: string;
    riskLevel: RiskLevel;
    ctaLabel: string;
    ctaUrl: string;
  };
  timeline: TimelineEvent[];
  lastUpdate: string;
}

export interface TimelineEvent {
  year: string;
  label: string;
  description: string;
  isCurrent?: boolean;
}

export const mockData: Record<Asset, AssetData> = {
  IBOV: {
    asset: "IBOV",
    title: "O Ibovespa Navega Entre a Euforia Fiscal e o Fantasma dos Juros Altos",
    narrative:
      "O índice brasileiro opera em zona de tensão narrativa. De um lado, o fluxo estrangeiro retorna timidamente, atraído por valuations descontados em relação a pares emergentes. De outro, a curva de juros longa permanece pressionada, refletindo o ceticismo do mercado com a trajetória fiscal do governo. O IBOV encontra suporte técnico nos 128 mil pontos, mas a falta de catalisadores de curto prazo mantém o mercado em compasso de espera. A temporada de balanços do 1T25 será decisiva para definir a direção do próximo movimento.",
    regime: "Risk-Off",
    regimeColor: "risk-off",
    action: {
      title: "Posição Defensiva em Dividendos",
      description:
        "Em cenários de Risk-Off, a estratégia recomendada é migrar para ativos geradores de caixa com dividend yield acima de 8%. Setores como utilities e bancos tradicionais oferecem proteção parcial contra volatilidade.",
      riskLevel: "moderado",
      ctaLabel: "Ver Carteira Defensiva",
      ctaUrl: "https://example.com/carteira-defensiva",
    },
    timeline: [
      { year: "2008", label: "Crise Subprime", description: "IBOV caiu 41% no ano. Pânico global." },
      { year: "2015-16", label: "Recessão + Impeachment", description: "Crise política e econômica profunda." },
      { year: "2020", label: "COVID Crash", description: "Circuit breaker. Queda de 46% em semanas." },
      { year: "2023", label: "Rally Pós-Eleição", description: "Recuperação com novo arcabouço fiscal." },
      { year: "2025", label: "Momento Atual", description: "Tensão fiscal vs. fluxo estrangeiro.", isCurrent: true },
    ],
    lastUpdate: "13 Abr 2026, 09:30 BRT",
  },
  DOLAR: {
    asset: "DOLAR",
    title: "Dólar Testa Resistência Psicológica Enquanto Fed Hesita",
    narrative:
      "O real opera sob pressão dupla: internamente, o risco fiscal eleva o prêmio de risco-país; externamente, o Fed mantém postura hawkish, fortalecendo o DXY. O dólar comercial flerta com os R$ 5,80, nível que historicamente atrai intervenção do BCB via swaps cambiais. O carry trade, antes atrativo, perde eficácia com a compressão do diferencial de juros reais. A volatilidade implícita nas opções de câmbio sugere que o mercado precifica um movimento direcional nas próximas 4-6 semanas.",
    regime: "Risk-Off",
    regimeColor: "risk-off",
    action: {
      title: "Hedge Cambial Parcial",
      description:
        "Considere proteção de 30-50% da exposição em ativos dolarizados. ETFs de renda fixa americana e ouro são veículos eficientes para este momento.",
      riskLevel: "alto",
      ctaLabel: "Explorar Hedge Cambial",
      ctaUrl: "https://example.com/hedge-cambial",
    },
    timeline: [
      { year: "2002", label: "Crise Lula", description: "Dólar atingiu R$ 3,99. Pânico eleitoral." },
      { year: "2015", label: "Crise Dilma", description: "Dólar rompeu R$ 4,00 pela primeira vez." },
      { year: "2020", label: "Pandemia", description: "Dólar atingiu R$ 5,90. Fuga de capitais." },
      { year: "2024", label: "Pressão Fiscal", description: "Dólar voltou a R$ 6,00+." },
      { year: "2025", label: "Momento Atual", description: "Teste de resistência nos R$ 5,80.", isCurrent: true },
    ],
    lastUpdate: "13 Abr 2026, 09:30 BRT",
  },
  SELIC: {
    asset: "SELIC",
    title: "Selic em Platô: O Copom Entre a Inflação Persistente e a Atividade Fraca",
    narrative:
      "A taxa Selic permanece em 14,75%, refletindo o dilema do Banco Central entre combater uma inflação de serviços ainda resiliente e não aprofundar a desaceleração econômica. As expectativas de inflação desancoradas no Focus pressionam o Copom a manter o tom duro, mas os sinais de esfriamento do mercado de trabalho começam a abrir espaço para um debate sobre o timing do primeiro corte. O consenso do mercado aponta para manutenção até o 3T25, com cortes graduais a partir de setembro.",
    regime: "Neutro",
    regimeColor: "caution",
    action: {
      title: "Alongar Duration Gradualmente",
      description:
        "Com a Selic em platô, títulos prefixados e IPCA+ longos começam a apresentar relação risco-retorno atrativa. Considere alocação gradual em NTN-B 2035+.",
      riskLevel: "moderado",
      ctaLabel: "Ver Oportunidades em RF",
      ctaUrl: "https://example.com/renda-fixa",
    },
    timeline: [
      { year: "2012", label: "Selic Mínima Histórica", description: "7,25% a.a. — era Tombini." },
      { year: "2016", label: "Pico Pós-Crise", description: "14,25% a.a. — combate à inflação." },
      { year: "2020", label: "Mínima COVID", description: "2,00% a.a. — estímulo emergencial." },
      { year: "2023", label: "Início do Corte", description: "Ciclo de corte pós-13,75%." },
      { year: "2025", label: "Momento Atual", description: "Platô em 14,75%. Debate sobre cortes.", isCurrent: true },
    ],
    lastUpdate: "13 Abr 2026, 09:30 BRT",
  },
  IPCA: {
    asset: "IPCA",
    title: "Inflação de Serviços Resiste e Desafia a Meta do BC",
    narrative:
      "O IPCA acumula 5,2% em 12 meses, acima do teto da meta de 4,5%. A decomposição revela o problema: enquanto bens industrializados seguem em desinflação (1,8%), os serviços intensivos em mão de obra rodam a 7,3%, contaminados por reajustes salariais acima da produtividade. Alimentação no domicílio voltou a pressionar após choques climáticos. O cenário base projeta convergência lenta para a meta apenas em 2026, o que mantém a política monetária restritiva por mais tempo que o desejado.",
    regime: "Risk-Off",
    regimeColor: "risk-off",
    action: {
      title: "Proteção Inflacionária Real",
      description:
        "IPCA+ com vencimentos intermediários (2029-2032) oferecem proteção contra inflação acima da meta com menor volatilidade de marcação a mercado.",
      riskLevel: "baixo",
      ctaLabel: "Ver Títulos IPCA+",
      ctaUrl: "https://example.com/ipca-plus",
    },
    timeline: [
      { year: "2015", label: "IPCA 10,67%", description: "Pior inflação em 13 anos." },
      { year: "2017", label: "IPCA 2,95%", description: "Abaixo da meta. Deflação alimentar." },
      { year: "2021", label: "Choque Pós-COVID", description: "IPCA 10,06%. Energia e combustíveis." },
      { year: "2023", label: "Desinflação", description: "IPCA 4,62%. Convergência parcial." },
      { year: "2025", label: "Momento Atual", description: "5,2%. Serviços ainda pressionados.", isCurrent: true },
    ],
    lastUpdate: "13 Abr 2026, 09:30 BRT",
  },
};
