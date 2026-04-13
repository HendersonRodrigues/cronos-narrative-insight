import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import type { AssetData } from "@/data/mockData";

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

const NarrativeCard = ({ data }: { data: AssetData }) => {
  const style = regimeStyles[data.regimeColor];

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

      <h1 className="font-body text-xl md:text-2xl font-semibold leading-tight text-foreground mb-5">
        {data.title}
      </h1>

      <p className="font-body text-base font-normal text-foreground/90" style={{ lineHeight: 1.7 }}>
        {data.narrative}
      </p>

      {data.curiosityGap && (
        <p className="mt-4 border-l-2 border-border pl-4 font-body text-sm italic text-muted-foreground" style={{ lineHeight: 1.65 }}>
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
