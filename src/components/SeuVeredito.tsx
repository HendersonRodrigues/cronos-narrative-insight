import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const options = [
  { emoji: "📉", label: "Pessimista" },
  { emoji: "↔️", label: "Neutro" },
  { emoji: "📈", label: "Otimista" },
];

const SeuVeredito = () => {
  const [voted, setVoted] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-5 md:p-6"
    >
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Seu Veredito
      </h3>

      <AnimatePresence mode="wait">
        {!voted ? (
          <motion.div key="question" exit={{ opacity: 0, y: -10 }}>
            <p className="font-body text-sm text-secondary-foreground mb-4">
              Como você sente o mercado hoje?
            </p>
            <div className="flex gap-3">
              {options.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setVoted(o.label)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary px-5 py-3 transition-all hover:border-primary/40 hover:bg-secondary/80"
                >
                  <span className="text-2xl">{o.emoji}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{o.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="thanks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-body text-sm text-secondary-foreground"
          >
            Obrigado! Veja como seu sentimento se compara ao Ciclo Histórico abaixo.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SeuVeredito;
