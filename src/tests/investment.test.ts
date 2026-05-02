import { describe, it, expect } from "vitest";

/**
 * Lógica de investimento — espelha helpers usados nos cards de oportunidade.
 * Mantemos as funções inline (puras) para validar a regra de negócio sem
 * acoplar a um componente específico.
 */
const extractMinMonths = (horizon: string): number => {
  const match = horizon.match(/\d+/);
  return match ? parseInt(match[0], 10) : 12;
};

const calculateReturn = (
  principal: number,
  annualRate: number,
  months: number,
) => {
  const monthlyRate = annualRate / 100 / 12;
  return principal + principal * monthlyRate * months;
};

describe("Lógica de investimento", () => {
  it("extrai o primeiro número como prazo mínimo", () => {
    expect(extractMinMonths("12 - 36 meses")).toBe(12);
    expect(extractMinMonths("24 meses")).toBe(24);
  });

  it("usa fallback de 12 meses quando não há número", () => {
    expect(extractMinMonths("Sem prazo")).toBe(12);
  });

  it("calcula retorno simples (R$1000 @ 12% a.a por 12 meses)", () => {
    expect(calculateReturn(1000, 12, 12)).toBe(1120);
  });
});
