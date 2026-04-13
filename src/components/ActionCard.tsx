import { motion } from "framer-motion";
import { Shield, ExternalLink } from "lucide-react";
import type { AssetData } from "@/data/mockData";

const riskBorder = {
  alto: "border-risk-off",
  moderado: "border-caution",
  baixo: "border-risk-on",
} as const;

const riskLabel = {
  alto: { text: "text-risk-off", label: "Risco Alto" },
  moderado: { text: "text-caution", label: "Risco Moderado" },
  baixo: { text: "text-risk-on", label: "Risco Baixo" },
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
        <Shield className="h-4 w-4 text-gold" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Ação Estratégica</span>
      </div>

      <h2 className="font-display text-lg md:text-xl font-semibold text-foreground mb-2">
        {action.title}
      </h2>

      <span className={`inline-block font-mono text-[10px] font-medium uppercase tracking-wider ${risk.text} mb-4`}>
        {risk.label}
      </span>

      <p className="font-body text-sm leading-relaxed text-secondary-foreground mb-6">
        {action.description}
      </p>

      <a
        href={action.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {action.ctaLabel}
        <ExternalLink className="h-4 w-4" />
      </a>
    </motion.div>
  );
};

export default ActionCard;
