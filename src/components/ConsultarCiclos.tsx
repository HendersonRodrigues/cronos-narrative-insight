import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Swords, TrendingUp, ChevronDown } from "lucide-react";

const defaultQuestions = [
  {
    icon: Compass,
    emoji: "🧭",
    label: "Qual cenário do passado mais se alinha a hoje?",
    answer:
      "O cenário atual apresenta semelhanças com o período de 2015-2016: juros elevados, câmbio pressionado e incerteza fiscal. A diferença-chave é o fluxo estrangeiro positivo, que oferece um colchão de liquidez inexistente naquela época. A combinação sugere um mercado em transição, não em colapso.",
  },
  {
    icon: Swords,
    emoji: "⚔️",
    label: "Comparar Selic vs Dólar (Últimos 2 anos)",
    answer:
      "Nos últimos 2 anos, a Selic subiu de 11,75% para 14,75%, enquanto o dólar oscilou entre R$ 4,80 e R$ 6,10. A correlação inversamente proporcional esperada nem sempre se manteve: em momentos de stress fiscal, ambos subiram simultaneamente, refletindo a percepção de risco-país acima do diferencial de juros.",
  },
  {
    icon: TrendingUp,
    emoji: "📈",
    label: "Perspectiva realista para Inflação 2026",
    answer:
      "O cenário base projeta IPCA entre 4,0% e 4,8% em 2026, com convergência gradual à meta. Os riscos de alta incluem: (1) repasse cambial defasado, (2) reajustes salariais em serviços, (3) choques climáticos em alimentação. O risco de baixa depende de uma desaceleração global mais pronunciada que reduza preços de commodities.",
  },
];

interface QuestionsData {
  pastRhyme: string | null;
  tugOfWar: string | null;
  realisticView: string | null;
}

interface Props {
  questions?: QuestionsData;
}

const ConsultarCiclos = ({ questions }: Props) => {
  const [open, setOpen] = useState<number | null>(null);

  // Merge live questions over defaults when available
  const items = defaultQuestions.map((q, i) => {
    const liveAnswer =
      i === 0 ? questions?.pastRhyme :
      i === 1 ? questions?.tugOfWar :
      questions?.realisticView;
    return { ...q, answer: liveAnswer || q.answer };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-5 md:p-8"
    >
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-5">
        Consultar Ciclos
      </h3>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-3 mb-4">
        {items.map((q, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 font-body text-xs transition-all ${
              open === i
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary/30 hover:bg-secondary/80"
            }`}
          >
            <span>{q.emoji}</span>
            <span className="text-left">{q.label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {open !== null && (
          <motion.div
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-secondary/50 p-5">
              <p className="font-body text-sm text-secondary-foreground" style={{ lineHeight: 1.7 }}>
                {items[open].answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConsultarCiclos;
