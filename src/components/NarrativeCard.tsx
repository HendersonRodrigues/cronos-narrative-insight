import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import type { AssetData } from "@/data/mockData";
import Sparkline from "./Sparkline";

const regimeStyles = {
  "risk-off": {
    badge: "bg-[hsl(0_20%_10%)] text-[hsl(0_70%_65%)] border border-[hsl(0_50%_20%/0.5)]",
    dot: "bg-[hsl(0_70%_55%)]",
  },
  "risk-on": {
    badge: "bg-[hsl(142_30%_12%)] text-[hsl(142_60%_55%)] border border-[hsl(142_40%_20%/0.5)]",
    dot: "bg-[hsl(142_60%_45%)]",
  },
  caution: {
    badge: "bg-[hsl(30_30%_12%)] text-[hsl(30_80%_60%)] border border-[hsl(30_40%_20%/0.5)]",
    dot: "bg-[hsl(30_80%_55%)]",
  },
} as const;

// Mock sparkline data per asset
const sparklineData: Record<string, number[]> = {
  IBOV: [126200, 127100, 126800, 128000, 127500, 128500, 128200],
  DOLAR: [5.72, 5.68, 5.75, 5.78, 5.80, 5.77, 5.82],
  SELIC: [14.75, 14.75, 14.75, 14.75, 14.75, 14.75, 14.75],
  IPCA: [5.1, 5.15, 5.18, 5.2, 5.19, 5.22, 5.2],
};

const NarrativeCard = ({ data }: { data: AssetData }) => {
  const style = regimeStyles[data.regimeColor];
  const sparkData = sparklineData[data.asset] || [];

  // Split narrative into first sentence (lead) and rest
  const firstDot = data.narrative.indexOf(". ");
  const lead = firstDot > 0 ? data.narrative.slice(0, firstDot + 1) : data.narrative;
  const rest = firstDot > 0 ? data.narrative.slice(firstDot + 2) : "";

  return (
    <motion.div
      key={data.asset}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-5 md:p-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">Autópsia Narrativa</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${style.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse-slow`} />
          {data.regime}
        </span>
      </div>

      {/* Sparkline - tendência da semana */}
      <div className="mb-3">
        <Sparkline data={sparkData} />
      </div>

      <h1 className="font-body text-xl md:text-2xl font-semibold leading-tight text-foreground mb-5">
        {data.title}
      </h1>

      {/* Lead paragraph - larger */}
      <p className="font-body text-lg font-normal text-foreground/90 mb-4" style={{ lineHeight: 1.75 }}>
        {lead}
      </p>

      {/* Rest of narrative */}
      {rest && (
        <p className="font-body text-base font-normal text-foreground/80" style={{ lineHeight: 1.7 }}>
          {rest}
        </p>
      )}

      {data.curiosityGap && (
        <p className="mt-5 border-l-2 border-border pl-4 font-body text-sm italic text-muted-foreground" style={{ lineHeight: 1.65 }}>
          {data.curiosityGap}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-mono text-[11px]">{data.lastUpdate}</span>
      </div>
    </motion.div>
  );
};

export default NarrativeCard;
