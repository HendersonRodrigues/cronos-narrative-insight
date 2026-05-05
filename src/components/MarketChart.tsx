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

const MIN_POINTS_BY_PERIOD: Record<PeriodKey, number> = {
  M: 2,
  "6M": 3,
  Y: 4,
  "3Y": 8,
  "5Y": 12,
  "10Y": 18,
};

const toDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);
const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
};

const formatAxisTick = (timestamp: number, period: PeriodKey) => {
  const date = new Date(timestamp);
  if (period === "M") {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" });
};

export default function MarketChart({ snapshots, isLoading: loadingSnapshots, defaultAsset }: MarketChartProps) {
  const available = Object.keys(snapshots);
  const [selected, setSelected] = useState(defaultAsset || available[0] || "selic");
  const [period, setPeriod] = useState<PeriodKey>("M");

  // Hook de Buffer/Cache para histórico profundo
  const { data: fullHistory, isLoading: loadingHistory } = useAssetHistory(selected);

  const active = selected;
  const meta = active ? getAssetMeta(active) : null;

  // Dentro do useMemo do MarketChart.tsx

const chartData = useMemo(() => {
  if (!fullHistory || fullHistory.length === 0) return { series: [], info: null };

  const daysLimit = PERIODS.find((p) => p.key === period)?.days ?? 30;
  
  // ÂNCORA CRÍTICA: Forçamos o gráfico a terminar HOJE (04/05/2026)
  const anchorEnd = normalizeDate(new Date()); 
  const startDate = new Date(anchorEnd);
  startDate.setDate(startDate.getDate() - daysLimit);

  // Filtramos o histórico total
  let periodData = fullHistory.filter((p) => {
    const d = toDate(p.date);
    return d >= startDate && d <= anchorEnd;
  });

  // LOGICA DE PREENCHIMENTO (Para Selic/IPCA não ficarem vazios em 1M)
  if (periodData.length < 2) {
    const lastPoint = [...fullHistory].reverse().find(p => toDate(p.date) <= anchorEnd);
    if (lastPoint) {
      // Se não tem dados no período, desenha uma linha reta do último valor conhecido
      periodData = [
        { ...lastPoint, date: toIsoDate(startDate) },
        { ...lastPoint, date: toIsoDate(anchorEnd) }
      ];
    }
  } else {
    // Garante que a linha encoste nas bordas do gráfico
    const first = periodData[0];
    const last = periodData[periodData.length - 1];
    
    if (toDate(first.date) > startDate) {
      const prev = [...fullHistory].reverse().find(p => toDate(p.date) < startDate) || first;
      periodData.unshift({ ...prev, date: toIsoDate(startDate) });
    }
    if (toDate(last.date) < anchorEnd) {
      periodData.push({ ...last, date: toIsoDate(anchorEnd) });
    }
  }

  // Downsampling para performance (apenas se houver muitos pontos)
  // ... (mantenha sua lógica de sampled se desejar)

  return {
    series: periodData.map(p => ({
      timestamp: toDate(p.date).getTime(),
      value: Number(p.value),
      label: formatDateBR(p.date)
    })),
    info: { hasFullPeriod: toDate(fullHistory[0].date) <= startDate }
  };
}, [selected, fullHistory, period]);

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
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  minTickGap={45}
                  tickFormatter={(value) => formatAxisTick(Number(value), period)}
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
                  labelFormatter={(value) => formatDateBR(toIsoDate(new Date(Number(value))))}
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
