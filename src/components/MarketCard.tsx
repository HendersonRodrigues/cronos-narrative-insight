import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBR, formatValue, getAssetMeta, pctChange } from "@/lib/format";
import type { AssetSnapshot } from "@/hooks/useMarketSnapshot";

interface MarketCardProps {
  assetId: string;
  snapshot?: AssetSnapshot;
  isLoading?: boolean;
}

/**
 * Sparkline SVG inline.
 *
 * Por que SVG puro (sem Recharts)?
 *  - Recharts adiciona ResponsiveContainer + medições que causam layout shift.
 *  - Aqui usamos viewBox fixo + preserveAspectRatio="none", o slot é
 *    reservado mesmo antes dos pontos chegarem (evita CLS).
 */
function Sparkline({
  points,
  trendUp,
}: {
  points: number[];
  trendUp: boolean;
}) {
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const w = 100;
    const h = 28;
    const stepX = w / (points.length - 1);
    const d = points
      .map((v, i) => {
        const x = (i * stepX).toFixed(2);
        const y = (h - ((v - min) / span) * h).toFixed(2);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return d;
  }, [points]);

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden
      className="block h-7 w-full"
    >
      {path && (
        <path
          d={path}
          fill="none"
          stroke={trendUp ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.85}
        />
      )}
    </svg>
  );
}

export default function MarketCard({ assetId, snapshot, isLoading }: MarketCardProps) {
  const meta = getAssetMeta(assetId);

  if (isLoading || !snapshot) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-2.5 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-5 w-24" />
        {/* Reserva o mesmo espaço da sparkline (h-5) para evitar layout shift */}
        <Skeleton className="h-5 w-full" />
      </Card>
    );
  }

  const { latest, previous, history } = snapshot;
  const delta = previous ? pctChange(latest.value, previous.value) : null;
  const trend = delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const sparkPoints = (history ?? []).slice(-30).map((p) => Number(p.value));

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm p-4 transition-all hover:border-primary/40 hover:bg-card/80">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {meta.short}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">{meta.label}</p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${
            trend === "up"
              ? "border-primary/30 bg-primary/10"
              : trend === "down"
                ? "border-destructive/30 bg-destructive/10"
                : "border-border/60 bg-muted/30"
          }`}
        >
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span className={`font-mono text-[10px] ${trendColor}`}>
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%`}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatValue(assetId, latest.value)}
        </p>
      </div>

      {/* Sparkline — slot fixo (h-7) renderizado mesmo sem dados suficientes */}
      <div className="mt-2 h-7 w-full">
        <Sparkline points={sparkPoints} trendUp={trend === "up"} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          {formatDateBR(latest.date)}
        </span>
        {previous && (
          <span className="font-mono text-muted-foreground/60 tabular-nums">
            ant: {formatValue(assetId, previous.value)}
          </span>
        )}
      </div>
    </Card>
  );
}
