import { Radio, AlertCircle } from "lucide-react";
import { useMarketFeed } from "@/hooks/useMarketFeed";

function formatValue(v: number) {
  if (v >= 1000) return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function FooterFeed() {
  const { data, isLoading, error } = useMarketFeed();

  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30">
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Feed de Mercado
            </span>
          </div>

          {isLoading && (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span className="font-mono uppercase tracking-wider">
                Feed indisponível: {(error as Error).message}
              </span>
            </div>
          )}

          {!isLoading && !error && data && data.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {data.slice(0, 8).map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border/50 bg-card/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      {row.asset_id}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(row.date)}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-base font-semibold text-foreground">
                    {formatValue(row.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && data && data.length === 0 && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Sem dados de mercado disponíveis.
            </p>
          )}
        </section>

        <section className="border-t border-border/40 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Disclaimer Educativo
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground/80 max-w-3xl">
            O conteúdo apresentado pelo CRONOS tem caráter exclusivamente informativo e
            educacional, não constituindo recomendação, oferta ou solicitação de compra ou
            venda de qualquer ativo financeiro. Decisões de investimento envolvem risco e
            devem ser tomadas com apoio de profissional habilitado pela CVM, considerando
            seu perfil, objetivos e situação patrimonial. Rentabilidade passada não é
            garantia de resultados futuros.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            © Cronos · Inteligência de Mercado
          </p>
        </section>
      </div>
    </footer>
  );
}
