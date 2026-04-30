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
import { TrendingUp } from "lucide-react";

interface MarketChartProps {
  snapshots: Record<string, AssetSnapshot>;
  isLoading?: boolean;
  defaultAsset?: string;
}

type PeriodKey = "M" | "6M" | "Y" | "3Y" | "5Y" | "10Y";
const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: "M", label: "1M", days: 30 },
  { key: "6M", label: "6M", days: 180 },
  { key: "Y", label: "1Y", days: 365 },
  { key: "3Y", label: "3Y", days: 365 * 3 },
  { key: "5Y", label: "5Y", days: 365 * 5 },
  { key: "10Y", label: "10Y", days: 365 * 10 },
];

export default function MarketChart({ snapshots, isLoading, defaultAsset }: MarketChartProps) {
  const available = Object.keys(snapshots);
  const [selected, setSelected] = useState<string>(defaultAsset ?? available[0] ?? "");
  const [period, setPeriod] = useState<PeriodKey>("M");

  const active = selected && snapshots[selected] ? selected : available[0] ?? "";
  const meta = active ? getAssetMeta(active) : null;

const chartData = useMemo(() => {
  const snap = active ? snapshots[active] : null;
  if (!snap || !snap.history || snap.history.length === 0) return [];

  const history = snap.history;
  const now = new Date();
  const selectedPeriod = PERIODS.find((p) => p.key === period);
  const daysLimit = selectedPeriod?.days ?? 30;

  // 1. Definimos a data final do gráfico: Se houver dados futuros, limitamos a hoje.
  // Se os dados pararem antes de hoje, usamos a data do último ponto disponível.
  const lastHistoryDate = new Date(history[history.length - 1].date);
  const endDate = lastHistoryDate > now ? now : lastHistoryDate;

  // 2. Definimos a data inicial baseada no período escolhido a partir da endDate
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - daysLimit);

  // 3. Filtragem: Pegamos tudo o que está dentro desse intervalo
  // Usamos uma margem de segurança para garantir que ativos mensais (IPCA) não sumam no 1M
  const filtered = history.filter((p) => {
    const pointDate = new Date(p.date);
    return pointDate >= startDate && pointDate <= endDate;
  });

  // 4. Fallback: Se o filtro for muito agressivo (ex: IPCA no 1M), 
  // garantimos que apareça ao menos os últimos 2 pontos para formar uma linha.
  let finalData = filtered;
  if (finalData.length < 2) {
    finalData = history.slice(-Math.min(history.length, 10));
  }

  // 5. Downsampling Dinâmico
  const totalPoints = finalData.length;
  const maxVisualPoints = 120;
  const dynamicStep = totalPoints > maxVisualPoints ? Math.ceil(totalPoints / maxVisualPoints) : 1;

  return finalData
    .filter((_, index) => index % dynamicStep === 0 || index === totalPoints - 1)
    .map((p) => ({
      date: p.date,
      label: formatDateBR(p.date),
      value: Number(p.value),
    }));
}, [snapshots, active, period]);
  

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

      {/* Altura fixa evita layout shift entre transições */}
      <div className="h-64 w-full">
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
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  minTickGap={40} // Aumentar isso ajuda a não amontoar datas em 10Y
                  tickFormatter={(value) => {
                    // Se o período for maior que 1 ano, mostra apenas o mês/ano para não poluir
                    if (period === "M") return value; 
                    const parts = value.split('/');
                    return `${parts[1]}/${parts[2]}`; // Retorna MM/AAAA
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
