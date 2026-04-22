import { useMemo } from "react";
import { useMarketFeed } from "./useMarketFeed";
import type { MarketDataPoint } from "@/types/cronos";

export interface AssetSnapshot {
  asset_id: string;
  latest: MarketDataPoint;
  previous?: MarketDataPoint;
  history: MarketDataPoint[];
}

/**
 * Reduz o feed bruto em um snapshot por ativo:
 * - latest: registro mais recente (date desc, id desc)
 * - previous: registro imediatamente anterior em data
 * - history: ordenado asc por data, pronto para gráficos
 */
export function useMarketSnapshot(assetIds?: string[]) {
  const query = useMarketFeed();

  const snapshots = useMemo<Record<string, AssetSnapshot>>(() => {
    const data = query.data ?? [];
    const grouped: Record<string, MarketDataPoint[]> = {};
    for (const row of data) {
      (grouped[row.asset_id] ||= []).push(row);
    }

    const out: Record<string, AssetSnapshot> = {};
    for (const [asset_id, rows] of Object.entries(grouped)) {
      // feed já vem date desc, id desc
      const desc = [...rows].sort((a, b) => {
        if (a.date === b.date) return b.id - a.id;
        return a.date < b.date ? 1 : -1;
      });
      const history = [...desc].reverse();
      out[asset_id] = {
        asset_id,
        latest: desc[0],
        previous: desc[1],
        history,
      };
    }
    return out;
  }, [query.data]);

  const filtered = useMemo(() => {
    if (!assetIds) return snapshots;
    const out: Record<string, AssetSnapshot> = {};
    for (const id of assetIds) if (snapshots[id]) out[id] = snapshots[id];
    return out;
  }, [snapshots, assetIds]);

  return {
    ...query,
    snapshots: filtered,
  };
}
