import { describe, it, expect } from "vitest";
import { pctChange } from "@/lib/format";

describe("pctChange", () => {
  it("calcula variação positiva corretamente", () => {
    expect(pctChange(110, 100)).toBeCloseTo(10);
  });

  it("calcula variação negativa corretamente", () => {
    expect(pctChange(90, 100)).toBeCloseTo(-10);
  });

  it("retorna 0 quando os valores são iguais", () => {
    expect(pctChange(100, 100)).toBe(0);
  });
});
