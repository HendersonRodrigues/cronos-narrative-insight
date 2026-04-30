import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import MarketCard from "./MarketCard";
import MarketChart from "./MarketChart";
import EmptyState from "./EmptyState";
import { AlertCircle, LineChart } from "lucide-react";

const FEATURED_ASSETS = ["ibov", "dolar", "sp500", "gold", "selic", "ipca"];

export default function MarketDashboard() {
  const { snapshots, isLoading, error } = useMarketSnapshot(FEATURED_ASSETS);
  const hasAnyData = Object.keys(snapshots).length > 0;

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <LineChart className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Painel de Mercado
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Atualizado pelo Cronos · dados do dia
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-destructive">
              Falha ao carregar mercado
            </p>
            <p className="text-xs text-destructive/80 mt-1">{(error as Error).message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {FEATURED_ASSETS.map((id) => (
          <MarketCard
            key={id}
            assetId={id}
            snapshot={snapshots[id]}
            isLoading={isLoading}
          />
        ))}
      </div>

      {!isLoading && !error && !hasAnyData ? (
        <EmptyState
          title="Sem dados de mercado"
          description="Assim que o Cronos sincronizar a próxima leitura, os indicadores aparecerão aqui."
        />
      ) : (
        <MarketChart snapshots={snapshots} isLoading={isLoading} defaultAsset="ibov" />
      )}
    </section>
  );
}
