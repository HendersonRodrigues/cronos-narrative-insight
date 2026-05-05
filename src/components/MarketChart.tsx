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
  // Se não houver histórico, retornamos vazio imediatamente
  if (!fullHistory || fullHistory.length === 0) return { series: [], info: null };

  const isSelic = selected === "selic";
  const isIPCA = selected === "ipca";
  const periodMeta = PERIODS.find((p) => p.key === period);
  const daysLimit = periodMeta?.days ?? 30;

  // 1. ÂNCORA TEMPORAL (O "HOJE" DA TESE)
  // Forçamos o gráfico a terminar sempre no dia 04/05/2026
  const anchorEnd = normalizeDate(new Date()); 
  const startDate = new Date(anchorEnd);
  startDate.setDate(startDate.getDate() - daysLimit);

  // 2. FILTRAGEM INICIAL
  // Pegamos apenas o que é igual ou anterior a hoje
  const allPastData = fullHistory.filter((p) => toDate(p.date) <= anchorEnd);

  // 3. IDENTIFICAÇÃO DE PONTOS DE BORDA (Crucial para Selic/IPCA)
  // Encontramos o último ponto antes do início do gráfico para garantir continuidade
  const lastPointBefore = [...allPastData]
    .reverse()
    .find((p) => toDate(p.date) < startDate);

  // Filtramos os pontos que estão dentro da janela visível
  let periodData = allPastData.filter((p) => toDate(p.date) >= startDate);

  // 4. LÓGICA DE RECONSTRUÇÃO DE LINHA (RESOLVE O VAZIO)
  if (isSelic || isIPCA) {
    // Caso A: Não há nenhuma alteração no período selecionado (ex: 1M estável)
    if (periodData.length === 0) {
      const reference = lastPointBefore || allPastData[allPastData.length - 1];
      if (reference) {
        periodData = [
          { ...reference, date: toIsoDate(startDate) },
          { ...reference, date: toIsoDate(anchorEnd) }
        ];
      }
    } 
    // Caso B: Existem pontos, mas precisamos "esticar" a linha até as bordas
    else {
      // Estica até a borda esquerda (Início do período)
      const firstActual = periodData[0];
      if (toDate(firstActual.date) > startDate) {
        const startEdge = lastPointBefore || firstActual;
        periodData.unshift({ ...startEdge, date: toIsoDate(startDate) });
      }

      // Estica até a borda direita (Hoje)
      const lastActual = periodData[periodData.length - 1];
      if (toDate(lastActual.date) < anchorEnd) {
        periodData.push({ ...lastActual, date: toIsoDate(anchorEnd) });
      }
    }
  } else {
    // Para ativos voláteis (IBOV/Dólar), apenas garantimos que o gráfico não fique vazio
    if (periodData.length === 0 && allPastData.length > 0) {
      // Fallback: se o período escolhido não tem dados, mostra os últimos 30 pontos
      periodData = allPastData.slice(-30);
    }
  }

  // 5. FORMATAÇÃO FINAL PARA O RECHARTS
  const series = periodData.map((p) => ({
    date: p.date,
    timestamp: toDate(p.date).getTime(),
    label: formatDateBR(p.date),
    value: Number(p.value),
  }));

  // 6. METADADOS DE CONTROLE
  const firstDateInDB = toDate(fullHistory[0].date);
  const totalYears = (
    (anchorEnd.getTime() - firstDateInDB.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  ).toFixed(1);

  return {
    series,
    info: {
      hasFullPeriod: firstDateInDB <= startDate,
      firstDate: formatDateBR(fullHistory[0].date),
      totalYears,
    },
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
                  domain={[chartData.series[0]?.timestamp, chartData.series[chartData.series.length - 1]?.timestamp]}
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
                  // Se for Selic ou IPCA, usa 'stepAfter' para desenhar degraus. 
                  // Caso contrário, usa 'monotone' para suavizar ações/moedas.
                  type={(selected === "selic" || selected === "ipca") ? "stepAfter" : "monotone"}
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
