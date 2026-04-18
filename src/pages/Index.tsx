import { useState } from "react";
import type { Asset } from "@/data/mockData";
import { useNarrative } from "@/hooks/useNarrative";
import CronosHeader from "@/components/CronosHeader";
import SeuVeredito from "@/components/SeuVeredito";
import NarrativeCard from "@/components/NarrativeCard";
import ActionCard from "@/components/ActionCard";
import ConsultarCiclos from "@/components/ConsultarCiclos";
import CycleTimeline from "@/components/CycleTimeline";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import NarrativeSkeleton from "@/components/NarrativeSkeleton";

const Index = () => {
  const [selected, setSelected] = useState<Asset>("IBOV");
  const { data, loading, error, isLive } = useNarrative(selected);

  // Determina se estamos em um estado de "Geração Profunda" (IA pensando)
  // Se está carregando e ainda não temos os dados 'live', é uma geração.
  const isGenerating = loading && !isLive;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <CronosHeader selected={selected} onSelect={setSelected} />

      <main className="container flex-1 py-8 space-y-6 max-w-4xl mx-auto">
        
        {/* Alerta de Erro / Fallback */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 animate-in fade-in duration-500">
            <p className="font-mono text-xs text-red-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              ⚠ Modo de Contingência: Falha na conexão com o Cérebro Cronos. Exibindo dados históricos de segurança.
            </p>
          </div>
        )}

        {/* Status da Inteligência */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-500/80 uppercase tracking-widest font-bold">
                  Sincronizado com Gemini 2.0 Flash
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-700" />
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                  Modo de Demonstração
                </span>
              </>
            )}
          </div>
          
          {data?.lastUpdate && !loading && (
            <span className="font-mono text-[10px] text-slate-600 uppercase">
              Atualizado em: {data.lastUpdate}
            </span>
          )}
        </div>

        <SeuVeredito />

        {loading ? (
          <div className="space-y-6">
            {/* Feedback visual de que a IA está trabalhando */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-xl bg-slate-900/50 space-y-3">
                <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-mono text-xs text-slate-400 animate-pulse">
                  Cronos está cruzando ciclos históricos de 20 anos...
                </p>
              </div>
            )}
            <NarrativeSkeleton />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <NarrativeCard data={data} />
            
            {/* Renderiza as perguntas guiadas apenas se existirem (vierem da IA) */}
            {data.questions && (
              <ConsultarCiclos questions={data.questions} />
            )}
            
            <ActionCard data={data} />
            
            {/* Timeline de ciclos históricos para reforçar o viés de dados do App */}
            <CycleTimeline events={data.timeline} />
          </div>
        )}
      </main>

      <DisclaimerFooter />
    </div>
  );
};

export default Index;
