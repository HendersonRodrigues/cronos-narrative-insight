import { describe, it, expect } from "vitest";
import { IS_SUPABASE_CONFIGURED, supabase } from "@/lib/supabase";

describe("Supabase client", () => {
  it("expõe um cliente instanciado", () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });

  it("expõe a flag de configuração", () => {
    expect(typeof IS_SUPABASE_CONFIGURED).toBe("boolean");
  });
});
