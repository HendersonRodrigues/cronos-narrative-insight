import { useMemo, useState } from "react";
import { ArrowUpRight, TrendingUp, Clock, ShieldCheck, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Opportunity } from "@/data/opportunities";
import { BENCHMARKS } from "@/data/opportunities";

const ACCENT_STYLES: Record<
  Opportunity["accent"],
  { ring: string; chip: string; bar: string; glow: string }
> = {
  gold: {
    ring: "border-accent/40 hover:border-accent/80",
    chip: "bg-accent/15 text-accent border-accent/30",
    bar: "bg-accent",
    glow: "shadow-[0_0_60px_-15px_hsl(45_70%_52%/0.45)]",
  },
  graphite: {
    ring: "border-foreground/15 hover:border-foreground/40",
    chip: "bg-foreground/10 text-foreground border-foreground/20",
    bar: "bg-foreground/70",
    glow: "shadow-[0_0_60px_-15px_hsl(0_0%_100%/0.15)]",
  },
  navy: {
    ring: "border-primary/30 hover:border-primary/70",
    chip: "bg-primary/15 text-primary border-primary/30",
    bar: "bg-primary",
    glow: "shadow-[0_0_60px_-15px_hsl(var(--primary)/0.45)]",
  },
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onInterest: (op: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onInterest }: OpportunityCardProps) {
  const [amount, setAmount] = useState<number>(1000);
  // Define o tempo inicial baseado no mínimo da oportunidade (ou 12 se não houver)
  const [months, setMonths] = useState<number>(opportunity.minMonths || 12);
  // Se o banco trouxer um accent que não existe ou for nulo, usa 'navy' como padrão
const styles = ACCENT_STYLES[opportunity.accent as keyof typeof ACCENT_STYLES] || ACCENT_STYLES.navy;

  // CÁLCULO DE JUROS SIMPLES: M = P + (P * i * n)
  const projection = useMemo(() => {
    const annualRate = opportunity.annualReturn / 100;
    const monthlyRate = annualRate / 12;
    const interest = amount * monthlyRate * months;
    return amount + interest;
  }, [amount, months, opportunity.annualReturn]);

  const maxRate = Math.max(
    opportunity.annualReturn,
    BENCHMARKS.cdi,
    BENCHMARKS.poupanca,
  );

  const bars = [
    { label: opportunity.title, rate: opportunity.annualReturn, highlight: true },
    { label: "CDI", rate: BENCHMARKS.cdi, highlight: false },
    { label: "Poupança", rate: BENCHMARKS.poupanca, highlight: false },
  ];

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-card/80 backdrop-blur p-6 transition-all ${styles.ring} ${styles.glow} hover:-translate-y-0.5 h-full`}
    >
      {/* Header - flex-1 garante que o conteúdo empurre o restante para baixo */}
      <div className="flex-1 space-y-5">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${styles.chip}`}
            >
              <TrendingUp className="h-3 w-3" />
              {opportunity.category}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {opportunity.horizon}
            </span>
          </div>

          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground leading-tight">
            {opportunity.title}
          </h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            {opportunity.description}
          </p>
        </header>

        {/* Performance badges - Aumentado conforme solicitado */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex flex-col items-start gap-0.5 rounded-lg border px-4 py-2 ${styles.chip}`}
          >
            <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">
              Possibilidade de Ganho
            </span>
            <span className="font-display text-xl font-bold">
              {opportunity.highlight}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {opportunity.riskLabel}
            </span>
          </div>
        </div>

        {/* Comparison */}
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Comparativo Real
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">% a.a.</span>
          </div>
          <div className="space-y-2">
            {bars.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={b.highlight ? "text-foreground font-medium" : "text-foreground/60"}>
                    {b.label}
                  </span>
                  <span className={`font-mono ${b.highlight ? "text-foreground" : "text-foreground/60"}`}>
                    {b.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${b.highlight ? styles.bar : "bg-foreground/25"}`}
                    style={{ width: `${(b.rate / maxRate) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calculator Section - Alinhada ao fundo com mt-auto */}
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-4 min-h-[190px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Simulador de Projeção
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase text-muted-foreground px-1">Valor (R$)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-8 bg-background/60 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase text-muted-foreground px-1">Tempo (Meses)</label>
              <Input
                type="number"
                min={opportunity.minMonths || 1}
                max={opportunity.maxMonths || 360}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="h-8 bg-background/60 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Em <span className="text-foreground font-medium">{months} meses</span>, seu capital seria aprox:
            </p>
            <p className="font-display text-lg font-bold text-foreground mt-0.5">
              {formatBRL(projection)}
            </p>
          </div>
        </div>

        {/* CTA Button - Sempre na base */}
        <Button
          onClick={() => onInterest(opportunity)}
          className="w-full bg-foreground text-background hover:bg-foreground/90 group/btn h-11"
        >
          Tenho Interesse
          <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Button>
      </div>
    </article>
  );
}
