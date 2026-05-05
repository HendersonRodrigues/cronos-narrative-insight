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
  snapshots?: Record<string, any>;
  isLoading?: boolean;
  defaultAsset?: string;
}

type PeriodKey = "M" | "6M" | "Y" | "3Y" | "5Y" | "10Y";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "M", label: "1M" }, { key: "6M", label: "6M" },
  { key: "Y", label: "1Y" }, { key: "3Y", label: "3Y" },
  { key: "5Y", label: "5Y" }, { key: "10Y", label: "10Y" },
];

const formatAxisTick = (timestamp: number, period: PeriodKey) => {
  const date = new Date(timestamp);
  return period === "M" 
    ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" });
};

export default function MarketChart({ snapshots, isLoading: loadingSnapshots, defaultAsset }: MarketChartProps) {
  // SEGURANÇA MÁXIMA: Garante que snapshots nunca seja null/undefined antes de Object.keys
  const available = useMemo(() => {
    if (!snapshots || typeof snapshots !== 'object') return [];
    return Object.keys(snapshots);
  }, [snapshots]);
  
  const [selected, setSelected] = useState(defaultAsset || "selic");
  const [period, setPeriod] = useState<PeriodKey>("M");

  const { chartData, isLoading: loadingHistory, isError, error } = useMarketSnapshot(selected, period);

  useEffect(() => {
    if (defaultAsset && available.includes(defaultAsset)) {
      setSelected(defaultAsset);
    } else if (available.length > 0 && !available.includes(selected) && selected === "selic") {
      // Caso o "selic" não esteja no objeto, seleciona o primeiro disponível
      setSelected(available[0]);
    }
  }, [defaultAsset, available, selected]);

  // Se estiver carregando os ativos iniciais ou se não houver ativos (snapshots vazios)
  if (loadingSnapshots || available.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-5 min-h-[400px] flex flex-col justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </Card>
    );
  }

  // Se houver erro ou os dados do gráfico específico estiverem vazios
  if (isError || chartData.series.length === 0) {
    const assetLabel = getAssetMeta(selected)?.label || selected;
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Dados para {assetLabel} indisponíveis</p>
        <p className="text-xs text-muted-foreground mt-1">Verifique a Edge Function no Supabase.</p>
      </Card>
    );
  }

  const meta = getAssetMeta(selected);
  const isRateAsset = selected === "selic" || selected === "ipca";

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Histórico de Mercado</p>
            <p className="font-display text-sm font-semibold text-foreground">{meta.label}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {available.map((id) => (
            <button 
              key={id} 
              type="button"
              onClick={() => setSelected(id)} 
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${id === selected ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30"}`}
            >
              {getAssetMeta(id).short}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-end gap-1">
        {PERIODS.map((p) => (
          <button 
            key={p.key} 
            type="button"
            onClick={() => setPeriod(p.key)} 
            className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${p.key === period ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/30"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${selected}-${period}`} 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.series} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={chartData.domain}
                  tickFormatter={(v) => formatAxisTick(v, period)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => formatValue(selected, v)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  labelFormatter={(v) => formatDateBR(new Date(v).toISOString().split('T')[0])}
                  formatter={(v: any) => [formatValue(selected, v), "Valor"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                {!isRateAsset && (
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeOpacity={0.2} strokeWidth={1} dot={false} isAnimationActive={false} />
                )}
                <Line
                  type={isRateAsset ? "stepAfter" : "monotone"}
                  dataKey={isRateAsset ? "value" : "trend"}
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  dot={selected === "ipca" ? { r: 3, fill: "hsl(var(--primary))" } : false}
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
