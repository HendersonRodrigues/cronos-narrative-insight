import { describe, it, expect } from "vitest";

/**
 * Smoke test do módulo Supabase.
 *
 * Importamos dinamicamente para que a falta de variáveis de ambiente em CI
 * não derrube a coleta do arquivo (o createClient lança quando a URL é vazia).
 */
describe("Supabase client", () => {
  it("expõe a flag IS_SUPABASE_CONFIGURED como boolean", async () => {
    try {
      const mod = await import("@/lib/supabase");
      expect(typeof mod.IS_SUPABASE_CONFIGURED).toBe("boolean");
    } catch (err) {
      // Sem env → cliente não instancia. Marcamos como warning aceito.
      expect((err as Error).message).toMatch(/supabaseUrl/i);
    }
  });
});
