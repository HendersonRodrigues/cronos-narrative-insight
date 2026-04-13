import { motion } from "framer-motion";
import { Shield, ExternalLink } from "lucide-react";
import type { AssetData } from "@/data/mockData";

const riskBorder = {
  alto: "border-destructive/60",
  moderado: "border-amber-500/60",
  baixo: "border-green-500/60",
} as const;

const riskLabel = {
  alto: { text: "text-destructive", label: "Risco Alto" },
  moderado: { text: "text-amber-400", label: "Risco Moderado" },
  baixo: { text: "text-green-400", label: "Risco Baixo" },
} as const;

const ActionCard = ({ data }: { data: AssetData }) => {
  const { action } = data;
  const border = riskBorder[action.riskLevel];
  const risk = riskLabel[action.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={`rounded-xl border-l-4 ${border} bg-card p-5 md:p-8`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Ação Estratégica</span>
      </div>

      <h2 className="font-body text-lg md:text-xl font-semibold text-foreground mb-2">
        {action.title}
      </h2>

      <span className={`inline-block font-mono text-[10px] font-medium uppercase tracking-wider ${risk.text} mb-4`}>
        {risk.label}
      </span>

      <p className="font-body text-sm font-normal text-secondary-foreground mb-6" style={{ lineHeight: 1.65 }}>
        {action.description}
      </p>

      <a
        href={action.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
      >
        {action.ctaLabel}
        <ExternalLink className="h-4 w-4" />
      </a>
    </motion.div>
  );
};

export default ActionCard;
