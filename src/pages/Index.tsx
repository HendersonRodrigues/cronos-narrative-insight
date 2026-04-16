import { useState } from "react";
import type { Asset } from "@/data/mockData";
import { mockData } from "@/data/mockData";
import CronosHeader from "@/components/CronosHeader";
import SeuVeredito from "@/components/SeuVeredito";
import NarrativeCard from "@/components/NarrativeCard";
import ActionCard from "@/components/ActionCard";
import ConsultarCiclos from "@/components/ConsultarCiclos";
import CycleTimeline from "@/components/CycleTimeline";
import DisclaimerFooter from "@/components/DisclaimerFooter";

const Index = () => {
  const [selected, setSelected] = useState<Asset>("IBOV");
  const data = mockData[selected];

  return (
    <div className="min-h-screen flex flex-col">
      <CronosHeader selected={selected} onSelect={setSelected} />

      <main className="container flex-1 py-8 space-y-6">
        <SeuVeredito />
        <NarrativeCard data={data} />
        <ConsultarCiclos />
        <ActionCard data={data} />
        <CycleTimeline events={data.timeline} />
      </main>

      <DisclaimerFooter />
    </div>
  );
};

export default Index;
