import { Radio, AlertCircle } from "lucide-react";
import { useMarketFeed } from "@/hooks/useMarketFeed";

// Formatação para valores numéricos
function formatValue(v: number | undefined) {
  if (v === undefined || v === null) return "-";
  if (v >= 1000) return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FooterFeed() {
  const { data, isLoading, error } = useMarketFeed();

  // 1. Processamento dos dados para a tabela comparativa
  const processedData = !isLoading && !error && data ? (() => {
    const assets = ['ibov', 'dolar', 'selic'];
    
    return assets.reduce((acc: any, asset) => {
      // Filtra os registros do ativo específico e garante ordem cronológica
      const series = data
        .filter(d => d.asset_id?.toLowerCase().trim() === asset)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      acc[asset] = {
        hoje: series[0]?.value,
        // Índice 21 aprox. 1 mês útil / Índice 252 aprox. 1 ano útil
        umMes: series[21]?.value,
        umAno: series[252]?.value
      };
      return acc;
    }, {});
  })() : null;

  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30">
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Monitor de Performance Temporal
            </span>
          </div>

          {isLoading && (
            <div className="h-32 w-full rounded-lg bg-muted/20 animate-pulse" />
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive p-4 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-3 w-3" />
              <span className="font-mono uppercase tracking-wider">
                Feed indisponível: {(error as Error).message}
              </span>
            </div>
          )}

          {!isLoading && !error && processedData && (
            <div className="overflow-hidden rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Janela Temporal</th>
                    <th className="px-4 py-3 font-medium text-center">IBOVESPA</th>
                    <th className="px-4 py-3 font-medium text-center">SELIC</th>
                    <th className="px-4 py-3 font-medium text-center">DÓLAR</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-border/20">
                  {[
                    { label: "Hoje (Atual)", key: "hoje", className: "text-primary font-bold" },
                    { label: "30 Dias atrás", key: "umMes", className: "text-muted-foreground/80 italic" },
                    { label: "1 Ano atrás", key: "umAno", className: "text-muted-foreground/50 italic" }
                  ].map((period) => (
                    <tr key={period.key} className="hover:bg-primary/5 transition-colors">
                      <td className={`px-4 py-3 ${period.className}`}>{period.label}</td>
                      <td className="px-4 py-3 text-center text-foreground font-medium">
                        {formatValue(processedData['ibov']?.[period.key])}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground font-medium">
                        {processedData['selic']?.[period.key] ? `${processedData['selic'][period.key].toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground font-medium">
                        {processedData['dolar']?.[period.key] ? `R$ ${formatValue(processedData['dolar'][period.key])}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Disclaimer Educativo (Mantido conforme original) */}
        <section className="border-t border-border/40 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Disclaimer Educativo
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground/70 max-w-3xl italic">
            O conteúdo apresentado pelo CRONOS tem caráter exclusivamente informativo...
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
            © 2026 Cronos Brain · Inteligência de Mercado
          </p>
        </section>
      </div>
    </footer>
  );
}
