import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";
import type { AssetData } from "@/data/mockData";

const regimeStyles = {
  "risk-off": { badge: "bg-risk-off text-risk-off border border-risk-off/30", dot: "bg-risk-off" },
  "risk-on": { badge: "bg-risk-on text-risk-on border border-risk-on/30", dot: "bg-risk-on" },
  caution: { badge: "bg-caution text-caution border border-caution/30", dot: "bg-caution" },
} as const;

const NarrativeCard = ({ data }: { data: AssetData }) => {
  const style = regimeStyles[data.regimeColor];

  return (
    <motion.div
      key={data.asset}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-5 md:p-8 glow-gold"
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

      <h1 className="font-display text-xl md:text-2xl font-bold leading-tight text-foreground mb-5">
        {data.title}
      </h1>

      <p className="font-body text-sm md:text-base leading-relaxed text-secondary-foreground">
        {data.narrative}
      </p>

      <div className="mt-5 flex items-center gap-2 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-mono text-[11px]">{data.lastUpdate}</span>
      </div>
    </motion.div>
  );
};

export default NarrativeCard;
