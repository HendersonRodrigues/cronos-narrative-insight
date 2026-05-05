import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateBR } from "@/lib/format";

interface DataPoint {
  d: string;
  v: number;
  t?: number;
}

interface AnalyticsSnapshot {
  data_points: DataPoint[];
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
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase
        .from("market_analytics_snapshots")
        .select("data_points")
        .eq("asset_id", selected)
        .eq("period_group", mapPeriodToGroup(period))
        .single();

      if (error) return []; // Retorna array vazio se não encontrar
      return (data as AnalyticsSnapshot).data_points || [];
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!selected && !!period,
  });

  const chartData = useMemo(() => {
    // PROTEÇÃO: Garante que rawPoints seja sempre um array
    const rawPoints = query.data ?? [];
    
    const now = new Date();
    const hojeStr = now.toISOString().split('T')[0];
    
    // Fallback para domínio caso não existam dados
    if (rawPoints.length === 0) {
      return { 
        series: [], 
        domain: [Date.now() - 86400000, Date.now()] 
      };
    }

    const periodsMap: Record<string, number> = {
      "M": 30, "6M": 180, "Y": 365, "3Y": 1095, "5Y": 1825, "10Y": 3650
    };
    
    const daysLimit = periodsMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysLimit);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Recorte do período
    let points = rawPoints.filter((p) => p.d >= startDateStr);

    // Lógica de Bordas
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
    } else {
      // Se não há dados no recorte, estica o último conhecido
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
      label: formatDateBR(p.d)
    }));

    return {
      series,
      domain: [
        new Date(`${startDateStr}T12:00:00`).getTime(),
        new Date(`${hojeStr}T12:00:00`).getTime()
      ]
    };
  }, [query.data, period, selected]);

  return { ...query, chartData };
}
