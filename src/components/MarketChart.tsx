import { useMemo, useState } from "react";
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
import type { AssetSnapshot } from "@/hooks/useMarketSnapshot";
import { useAssetHistory } from "@/hooks/useMarketFeed"; // Importando o novo hook
import { TrendingUp, CircleAlert as AlertCircle, Loader as Loader2 } from "lucide-react";

interface MarketChartProps {
  snapshots: Record<string, AssetSnapshot>;
  isLoading?: boolean;
  defaultAsset?: string;
}

type PeriodKey = "M" | "6M" | "Y" | "3Y" | "5Y" | "10Y";
const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: "M", label: "1M", days: 28 },
  { key: "6M", label: "6M", days: 180 },
  { key: "Y", label: "1Y", days: 365 },
  { key: "3Y", label: "3Y", days: 365 * 3 },
  { key: "5Y", label: "5Y", days: 365 * 5 },
  { key: "10Y", label: "10Y", days: 365 * 10 },
];

export default function MarketChart({ snapshots, isLoading: loadingSnapshots, defaultAsset }: MarketChartProps) {
  const available = Object.keys(snapshots);
  const [selected, setSelected] = useState(defaultAsset || available[0] || "selic");
  const [period, setPeriod] = useState<PeriodKey>("M");

  // Hook de Buffer/Cache para histórico profundo
  const { data: fullHistory, isLoading: loadingHistory } = useAssetHistory(selected);

  const active = selected;
  const meta = active ? getAssetMeta(active) : null;

  const chartData = useMemo(() => {
    if (!fullHistory || fullHistory.length === 0) return { series: [], info: null };

    const daysLimit = PERIODS.find((p) => p.key === period)?.days ?? 30;
    const firstDateInDB = new Date(fullHistory[0].date);

    // Usar a data atual como referência para o fim do período
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Calcular intervalo de datas baseado no período selecionado
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysLimit);

    // Filtrar dados dentro do período
    const filtered = fullHistory.filter(p => {
      const d = new Date(p.date);
      return d >= startDate && d <= now;
    });

    // Se não há dados no período, usar todos os dados disponíveis
    const series = (filtered.length > 0 ? filtered : fullHistory)
      .map(p => ({
        date: p.date,
        label: formatDateBR(p.date),
        value: Number(p.value)
      }));

    // Verificação: se o primeiro registro do DB está depois da data de início do período
    // significa que não temos dados completos para esse período
    const hasFullPeriod = firstDateInDB <= startDate;

    // Calcular anos de dados disponíveis
    const endDate = new Date(fullHistory[fullHistory.length - 1].date);
    const totalYears = ((endDate.getTime() - firstDateInDB.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

    return {
      series,
      info: {
        hasFullPeriod,
        firstDate: formatDateBR(firstDateInDB),
        totalYears
      }
    };
  }, [fullHistory, period]);

  if (loadingSnapshots || (loadingHistory && chartData.series.length === 0)) {
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

  if (available.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Sem dados de mercado disponíveis
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Histórico
            </p>
            <p className="font-display text-sm font-semibold text-foreground">
              {meta?.label ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {available.map((id) => {
            const m = getAssetMeta(id);
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {m.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-end gap-1">
        {PERIODS.map((p) => {
          const isActive = p.key === period;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Alerta de Período Máximo (Elegante) */}
      {chartData.info && !chartData.info.hasFullPeriod && !loadingHistory && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 border border-amber-500/20"
        >
          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-[10px] font-mono uppercase tracking-tight text-amber-500/90">
            Limite de dados atingido: histórico disponível desde {chartData.info.firstDate} ({chartData.info.totalYears} anos)
          </p>
        </motion.div>
      )}
      
      <div className="h-64 w-full relative">
        {loadingHistory && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/40 backdrop-blur-[1px]">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
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
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  minTickGap={45}
                  tickFormatter={(value) => {
                    if (period === "M") return value; 
                    const parts = value.split('/');
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : value;
                  }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={60}
                  tickFormatter={(v) => (active ? formatValue(active, Number(v)) : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
                  formatter={(val: number) => [active ? formatValue(active, val) : val, meta?.short ?? ""]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#lineGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
