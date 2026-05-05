import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import MarketCard from "./MarketCard";
import MarketChart from "./MarketChart";
import EmptyState from "./EmptyState";
import { AlertCircle, LineChart, Loader2 } from "lucide-react";
import { useMemo } from "react";

const FEATURED_ASSETS = ["ibov", "dolar", "sp500", "gold", "selic", "ipca"];

export default function MarketDashboard() {
  // Chamada do hook
  const { snapshots, isLoading, error } = useMarketSnapshot(FEATURED_ASSETS);

  // ESTRATÉGIA DE PROTEÇÃO: 
  // 1. Garantimos que 'snapshots' seja sempre tratado como objeto, mesmo que venha nulo
  // 2. Usamos useMemo para evitar cálculos desnecessários e erros de referência
  const safeSnapshots = useMemo(() => snapshots || {}, [snapshots]);
  const hasAnyData = useMemo(() => Object.keys(safeSnapshots).length > 0, [safeSnapshots]);

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

      {/* Se houver erro, mostramos o aviso mas NÃO travamos a página */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-destructive">
              Sincronização em modo de segurança
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              {(error as Error).message.includes("403") 
                ? "Erro de permissão no banco (403). Verifique as políticas RLS." 
                : (error as Error).message}
            </p>
          </div>
        </div>
      )}

      {/* Cards de Mercado */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {FEATURED_ASSETS.map((id) => (
          <MarketCard
            key={id}
            assetId={id}
            snapshot={safeSnapshots[id]} // Usa o objeto seguro
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Lógica do Gráfico ou Empty State */}
      {isLoading ? (
        <div className="h-64 w-full flex items-center justify-center border rounded-xl bg-muted/5 border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-mono uppercase tracking-widest">Carregando Indicadores...</span>
          </div>
        </div>
      ) : !hasAnyData ? (
        <EmptyState
          title="Dados Indisponíveis"
          description="Aguardando liberação do banco de dados ou processamento dos snapshots."
        />
      ) : (
        <MarketChart 
          snapshots={safeSnapshots} 
          isLoading={isLoading} 
          defaultAsset="ibov" 
        />
      )}
    </section>
  );
}
