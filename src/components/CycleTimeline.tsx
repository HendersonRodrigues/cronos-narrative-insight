import { motion } from "framer-motion";
import { History } from "lucide-react";
import type { TimelineEvent } from "@/data/mockData";

const CycleTimeline = ({ events }: { events: TimelineEvent[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="rounded-xl border border-border bg-card p-5 md:p-8"
  >
    <div className="mb-5 flex items-center gap-2">
      <History className="h-4 w-4 text-gold" />
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Linha do Tempo de Ciclos
      </span>
    </div>

    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-6">
        {events.map((e, i) => (
          <div key={i} className="relative flex gap-4 pl-6">
            {/* dot */}
            <span
              className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 ${
                e.isCurrent
                  ? "border-primary bg-primary/30 animate-pulse-slow"
                  : "border-border bg-secondary"
              }`}
            />

            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`font-mono text-xs font-medium ${e.isCurrent ? "text-gold" : "text-muted-foreground"}`}>
                  {e.year}
                </span>
                <span className={`font-body text-sm font-semibold ${e.isCurrent ? "text-foreground" : "text-secondary-foreground"}`}>
                  {e.label}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {e.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default CycleTimeline;
