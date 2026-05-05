import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateBR } from "@/lib/format";

interface DataPoint {
  d: string;
  v: number;
  t?: number;
}

const mapPeriodToGroup = (period: string): string => {
  if (["M", "6M"].includes(period)) return "short";
  if (["Y", "3Y"].includes(period)) return "mid";
  return "long"; 
};

export function useMarketSnapshot(selected: string, period: string) {
  const query = useQuery({
    queryKey: ["market_snapshot", selected, mapPeriodToGroup(period)],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from("market_analytics_snapshots")
        .select("data_points")
        .eq("asset_id", selected)
        .eq("period_group", mapPeriodToGroup(period))
        .maybeSingle();

      if (error || !data) return [];
      return data.data_points || [];
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!selected && !!period,
  });

  const chartData = useMemo(() => {
    // Garante que rawPoints seja um array, mesmo em erro
    const rawPoints = Array.isArray(query.data) ? query.data : [];
    const now = new Date();
    const hojeStr = now.toISOString().split('T')[0];
    
    if (rawPoints.length === 0) {
      return { series: [], domain: [Date.now() - 86400000, Date.now()], isEmpty: true };
    }

    const periodsMap: Record<string, number> = {
      "M": 30, "6M": 180, "Y": 365, "3Y": 1095, "5Y": 1825, "10Y": 3650
    };
    
    const daysLimit = periodsMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysLimit);
    const startDateStr = startDate.toISOString().split('T')[0];

    let points = rawPoints.filter((p) => p.d >= startDateStr);

    if (points.length === 0 && rawPoints.length > 0) {
      const lastKnown = rawPoints[rawPoints.length - 1];
      points = [{ ...lastKnown, d: startDateStr }, { ...lastKnown, d: hojeStr }];
    } else if (points.length > 0) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      if (firstPoint.d > startDateStr) {
        const backupPoint = [...rawPoints].reverse().find(p => p.d < startDateStr) || firstPoint;
        points.unshift({ ...backupPoint, d: startDateStr });
      }
      if (lastPoint.d < hojeStr) points.push({ ...lastPoint, d: hojeStr });
    }

    const series = points.map((p) => {
      const [year, month, day] = p.d.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      return {
        timestamp: date.getTime(),
        value: Number(p.v || 0),
        trend: Number((p.t ?? p.v) || 0),
        label: formatDateBR(p.d)
      };
    });

    return {
      series,
      domain: [
        new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0).getTime(),
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime()
      ],
      isEmpty: series.length === 0
    };
  }, [query.data, period, selected]);

  return { ...query, chartData };
}
