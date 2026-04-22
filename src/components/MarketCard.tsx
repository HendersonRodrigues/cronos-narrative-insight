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

export default function MarketCard({ assetId, snapshot, isLoading }: MarketCardProps) {
  const meta = getAssetMeta(assetId);

  if (isLoading || !snapshot) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-24" />
      </Card>
    );
  }

  const { latest, previous } = snapshot;
  const delta = previous ? pctChange(latest.value, previous.value) : null;
  const trend = delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

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
