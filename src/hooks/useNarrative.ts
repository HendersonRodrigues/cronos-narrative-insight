import { useState, useEffect } from "react";
import type { Asset } from "@/data/mockData";
import { mockData } from "@/data/mockData";
import type { MappedAssetData } from "@/types/narrative";
import { fetchNarrativeByAsset } from "@/services/narrativeService";

interface UseNarrativeReturn {
  data: MappedAssetData;
  loading: boolean;
  error: string | null;
  isLive: boolean;
}

function mockToMapped(asset: Asset): MappedAssetData {
  const m = mockData[asset];
  return {
    ...m,
    questions: { pastRhyme: null, tugOfWar: null, realisticView: null },
  };
}

export function useNarrative(asset: Asset): UseNarrativeReturn {
  const [data, setData] = useState<MappedAssetData>(mockToMapped(asset));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNarrativeByAsset(asset)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setData(result);
          setIsLive(true);
        } else {
          setData(mockToMapped(asset));
          setIsLive(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Erro de conexão");
        setData(mockToMapped(asset));
        setIsLive(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [asset]);

  return { data, loading, error, isLive };
}
