import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBR, formatValue, getAssetMeta } from "@/lib/format";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { TrendingUp, CircleAlert as AlertCircle, Loader as Loader2 } from "lucide-react";

interface MarketChartProps {
  snapshots: Record<string, any>; // Recebido do componente pai para listar ativos
  isLoading?: boolean;
  defaultAsset?: string;
}

type PeriodKey = "M" | "6M" | "Y" | "3Y" | "5Y" | "10Y";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "M", label: "1M" },
  { key: "6M", label: "6M" },
  { key: "Y", label: "1Y" },
  { key: "3Y", label: "3Y" },
  { key: "5Y", label: "5Y" },
  { key: "10Y", label: "10Y" },
];

/**
 * Formata os ticks do eixo X de acordo com a densidade do período
 */
const formatAxisTick = (timestamp: number, period: PeriodKey) => {
  const date = new Date(timestamp);
  if (period === "M") {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" });
};

export default function MarketChart({ 
  snapshots: initialSnapshots = {}, 
  isLoading: loadingSnapshots, 
  defaultAsset 
}: MarketChartProps) {
  
  // 1. Estados de Seleção
  const available = useMemo(() => Object.keys(initialSnapshots || {}), [initialSnapshots]);
  const [selected, setSelected] = useState(defaultAsset || (available.length > 0 ? available[0] : "selic"));
  const [period, setPeriod] = useState<PeriodKey>("M");

  // 2. Consumo do Hook Otimizado (Backend-driven)
  const { chartData, isLoading: loadingHistory, isError, error } = useMarketSnapshot(selected, period);

  console.log("DEBUG - Ativo Selecionado:", selected);
  console.log("DEBUG - Dados do Gráfico:", chartData);
  if (isError) console.error("DEBUG - Erro do Supabase:", error);

  const active = selected;
  const meta = active ? getAssetMeta(active) : null;
  const isRateAsset = active === "selic" || active === "ipca";

  // Sincroniza o ativo selecionado caso o defaultAsset mude externamente
  useEffect(() => {
    if (defaultAsset && available.includes(defaultAsset)) {
      setSelected(defaultAsset);
    }
  }, [defaultAsset, available]);

  // 3. Renderização de Loading Inicial
  if (loadingSnapshots || (loadingHistory && (!chartData || chartData.series.length === 0))) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  // 4. Renderização de Estado de Erro ou Vazio
  if (isError || !chartData || chartData.series.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Histórico indisponível</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          Os dados para {meta?.label || selected} ainda não foram processados pelo backend.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-5">
      {/* HEADER: Identificação e Troca de Ativo */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Histórico de Mercado
            </p>
            <p className="font-display text-sm font-semibold text-foreground">
              {meta?.label ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {available.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                id === active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {getAssetMeta(id).short}
            </button>
          ))}
        </div>
      </div>

      {/* TABS: Seleção de Período */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              p.key === period
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* CONTAINER DO GRÁFICO */}
      <div className="h-64 w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active}-${period}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  stroke="hsl(var(--border))" 
                  strokeDasharray="3 3" 
                  opacity={0.2} 
                  vertical={false} 
                />
                
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={chartData.domain}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  minTickGap={45}
                  tickFormatter={(value) => formatAxisTick(Number(value), period)}
                />
                
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={60}
                  tickFormatter={(v) => formatValue(active, Number(v))}
                />
                
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
                  labelFormatter={(value) => formatDateBR(new Date(Number(value)).toISOString())}
                  formatter={(val: number) => [formatValue(active, val), "Valor"]}
                />

                {/* LINHA DE FUNDO: Valor Real (Sombra para ativos voláteis) */}
                {!isRateAsset && (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}

                {/* LINHA PRINCIPAL: Tendência (SMA) ou Degraus (Selic) */}
                <Line
                  type={isRateAsset ? "stepAfter" : "monotone"}
                  dataKey={isRateAsset ? "value" : "trend"}
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  dot={active === "ipca" ? { r: 3, fill: "hsl(var(--primary))" } : false}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  isAnimationActive={!loadingHistory}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
