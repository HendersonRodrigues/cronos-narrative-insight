import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateBR } from "@/lib/format";

interface DataPoint {
  d: string; // Data ISO
  v: number; // Valor Real
  t?: number; // Valor de Tendência (SMA)
}

interface AnalyticsSnapshot {
  data_points: DataPoint[];
}

const mapPeriodToGroup = (period: string): string => {
  if (["M", "6M"].includes(period)) return "short";
  if (["Y", "3Y"].includes(period)) return "mid";
  return "long"; 
};

/**
 * Hook para consumo de Snapshots pré-processados (Backend-driven)
 * Substitui a lógica antiga de processamento pesado no frontend.
 */
export function useMarketSnapshot(selected: string, period: string) {
  const query = useQuery({
    queryKey: ["market_snapshot", selected, mapPeriodToGroup(period)],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase
        .from("market_analytics_snapshots")
        .select("data_points")
        .eq("asset_id", selected)
        .eq("period_group", mapPeriodToGroup(period))
        .single();

      if (error) throw error;
      return (data as AnalyticsSnapshot).data_points;
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!selected && !!period,
  });

  const chartData = useMemo(() => {
    const rawPoints = query.data;
    if (!rawPoints || rawPoints.length === 0) return { series: [], domain: [0, 0] };

    const now = new Date();
    const periodsMap: Record<string, number> = {
      "M": 30, "6M": 180, "Y": 365, "3Y": 1095, "5Y": 1825, "10Y": 3650
    };
    
    const daysLimit = periodsMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysLimit);
    const startDateStr = startDate.toISOString().split('T')[0];
    const hojeStr = now.toISOString().split('T')[0];

    const rawPoints = query.data ?? []; // Garante que nunca seja null/undefined
    if (rawPoints.length === 0) {
      return { series: [], domain: [Date.now() - 86400000, Date.now()] };
    }

    // Recorte do período dentro do snapshot
    let points = rawPoints.filter((p) => p.d >= startDateStr);

    // Lógica de Bordas para Selic/IPCA e Continuidade
    if (points.length > 0) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      if (firstPoint.d > startDateStr) {
        const backupPoint = [...rawPoints].reverse().find(p => p.d < startDateStr) || firstPoint;
        points.unshift({ ...backupPoint, d: startDateStr });
      }

      if (lastPoint.d < hojeStr) {
        points.push({ ...lastPoint, d: hojeStr });
      }
    } else if (rawPoints.length > 0) {
      const lastKnown = rawPoints[rawPoints.length - 1];
      points = [
        { ...lastKnown, d: startDateStr },
        { ...lastKnown, d: hojeStr }
      ];
    }

    const series = points.map((p) => ({
      timestamp: new Date(`${p.d}T12:00:00`).getTime(),
      value: p.v,
      trend: p.t ?? p.v,
      label: formatDateBR(p.d),
      dateStr: p.d
    }));

    return {
      series,
      domain: [
        new Date(`${startDateStr}T12:00:00`).getTime(),
        new Date(`${hojeStr}T12:00:00`).getTime()
      ]
    };
  }, [query.data, period, selected]);

  return {
    ...query,
    chartData,
  };
}
