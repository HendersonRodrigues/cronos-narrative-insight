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

  return (
    <div className="min-h-screen flex flex-col">
      <CronosHeader selected={selected} onSelect={setSelected} />

      <main className="container flex-1 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-[hsl(0_50%_20%/0.5)] bg-[hsl(0_20%_10%)] p-4">
            <p className="font-mono text-xs text-[hsl(0_70%_65%)]">
              ⚠ Falha ao conectar com o banco de dados. Exibindo dados de demonstração.
            </p>
          </div>
        )}

        {isLive && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[hsl(142_60%_45%)] animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Dados ao vivo</span>
          </div>
        )}

        <SeuVeredito />

        {loading ? (
          <NarrativeSkeleton />
        ) : (
          <>
            <NarrativeCard data={data} />
            <ConsultarCiclos questions={data.questions} />
            <ActionCard data={data} />
            <CycleTimeline events={data.timeline} />
          </>
        )}
      </main>

      <DisclaimerFooter />
    </div>
  );
};

export default Index;
