import { describe, it, expect } from "vitest";
import { pctChange } from "@/lib/format";

/**
 * Testes abrangentes para funcionalidades principais da Cronos
 */

// ===== TESTES DE CÁLCULO FINANCEIRO =====
describe("Cálculos Financeiros", () => {
  it("calcula variação percentual positiva", () => {
    expect(pctChange(150, 100)).toBeCloseTo(50);
  });

  it("calcula variação percentual negativa", () => {
    expect(pctChange(50, 100)).toBeCloseTo(-50);
  });

  it("trata valores zero com segurança", () => {
    expect(pctChange(100, 0)).toBe(null);
  });

  it("retorna exatamente 0 para valores iguais", () => {
    expect(pctChange(100, 100)).toBe(0);
  });

  it("calcula flutuações pequenas com precisão", () => {
    expect(pctChange(101.5, 100)).toBeCloseTo(1.5, 1);
  });
});

// ===== TESTES DE EXTRAÇÃO DE DADOS =====
describe("Extração de Dados de Texto", () => {
  const extractNumber = (text: string): number => {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  it("extrai número único", () => {
    expect(extractNumber("12 meses")).toBe(12);
  });

  it("extrai primeiro número em intervalo", () => {
    expect(extractNumber("12 a 36 meses")).toBe(12);
  });

  it("retorna 0 quando não há números", () => {
    expect(extractNumber("sem prazo")).toBe(0);
  });

  it("ignora números decimais (pega parte inteira)", () => {
    expect(extractNumber("12.5 meses")).toBe(12);
  });
});

// ===== TESTES DE VALIDAÇÃO =====
describe("Validação de Dados", () => {
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  it("valida email correto", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("rejeita email sem domínio", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejeita email sem arroba", () => {
    expect(isValidEmail("userexamplecom")).toBe(false);
  });

  it("rejeita email com espaços", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});

// ===== TESTES DE FORMATAÇÃO =====
describe("Formatação de Valores", () => {
  const formatCurrency = (value: number): string => {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  it("formata valor em reais", () => {
    expect(formatCurrency(1000)).toBe("R$ 1.000,00");
  });

  it("formata valores decimais", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
  });

  it("formata valores pequenos", () => {
    expect(formatCurrency(9.99)).toBe("R$ 9,99");
  });
});

// ===== TESTES DE LÓGICA DE INVESTIMENTO =====
describe("Lógica de Investimento Avançada", () => {
  const calculateCompoundReturn = (
    principal: number,
    annualRate: number,
    months: number,
  ): number => {
    const monthlyRate = annualRate / 100 / 12;
    let value = principal;
    for (let i = 0; i < months; i++) {
      value *= 1 + monthlyRate;
    }
    return value;
  };

  it("calcula retorno composto para 12 meses", () => {
    const result = calculateCompoundReturn(1000, 12, 12);
    expect(result).toBeGreaterThan(1120);
    expect(result).toBeLessThan(1130);
  });

  it("calcula retorno composto para 24 meses", () => {
    const result = calculateCompoundReturn(1000, 12, 24);
    expect(result).toBeGreaterThan(1260);
  });

  it("retorna valor inicial com taxa 0%", () => {
    const result = calculateCompoundReturn(1000, 0, 12);
    expect(result).toBe(1000);
  });
});

// ===== TESTES DE RISCO =====
describe("Classificação de Risco", () => {
  const classifyRisk = (volatility: number): string => {
    if (volatility < 10) return "baixo";
    if (volatility < 20) return "medio";
    return "alto";
  };

  it("classifica volatilidade baixa", () => {
    expect(classifyRisk(5)).toBe("baixo");
  });

  it("classifica volatilidade média", () => {
    expect(classifyRisk(15)).toBe("medio");
  });

  it("classifica volatilidade alta", () => {
    expect(classifyRisk(25)).toBe("alto");
  });

  it("usa limite exato para transição média/alta", () => {
    expect(classifyRisk(20)).toBe("alto");
    expect(classifyRisk(19.99)).toBe("medio");
  });
});
