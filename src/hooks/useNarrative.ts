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

/**
 * Helper para transformar mock em MappedAssetData quando não houver dado real.
 */
function mockToMapped(asset: Asset): MappedAssetData {
  const m = mockData[asset];
  return {
    ...m,
    questions: { 
      pastRhyme: null, 
      tugOfWar: null, 
      realisticView: null 
    },
  };
}

export function useNarrative(asset: Asset): UseNarrativeReturn {
  // Inicializamos com o mock para evitar telas brancas (estratégia de "Optimistic UI" ou Fallback)
  const [data, setData] = useState<MappedAssetData>(mockToMapped(asset));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNarrative() {
      setLoading(true);
      setError(null);

      try {
        // Chamamos o serviço que agora lida com Banco + Edge Function
        const result = await fetchNarrativeByAsset(asset);

        if (cancelled) return;

        if (result) {
          setData(result);
          setIsLive(true);
        } else {
          // Se retornar null (erro na função ou sem dados), mantemos o mock
          setData(mockToMapped(asset));
          setIsLive(false);
        }
      } catch (err: any) {
        if (cancelled) return;
        
        console.error(`[Hook useNarrative] Erro ao carregar ativo ${asset}:`, err);
        setError(err.message ?? "Erro ao sincronizar com Cronos");
        setData(mockToMapped(asset));
        setIsLive(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNarrative();

    return () => {
      cancelled = true;
    };
  }, [asset]);

  return { data, loading, error, isLive };
}

