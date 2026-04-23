import { useMemo, useState } from "react";
import { ArrowUpRight, TrendingUp, Clock, ShieldCheck } from "lucide-react";
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onInterest: (op: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onInterest }: OpportunityCardProps) {
  const [amount, setAmount] = useState<number>(1000);
  const styles = ACCENT_STYLES[opportunity.accent];

  const projection = useMemo(() => {
    const r = opportunity.annualReturn / 100;
    return amount * (1 + r);
  }, [amount, opportunity.annualReturn]);

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
      className={`group relative flex flex-col gap-5 rounded-2xl border bg-card/80 backdrop-blur p-6 transition-all ${styles.ring} ${styles.glow} hover:-translate-y-0.5`}
    >
      {/* Header */}
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

      {/* Performance badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5 ${styles.chip}`}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
            Possibilidade
          </span>
          <span className="font-display text-base font-semibold">
            {opportunity.highlight}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5">
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
            Comparativo Anual
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">% a.a.</span>
        </div>
        <div className="space-y-2">
          {bars.map((b) => (
            <div key={b.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    b.highlight ? "text-foreground font-medium" : "text-foreground/60"
                  }
                >
                  {b.label}
                </span>
                <span
                  className={`font-mono ${b.highlight ? "text-foreground" : "text-foreground/60"}`}
                >
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

      {/* Calculator */}
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Projeção em 12 meses
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">R$</span>
          <Input
            type="number"
            min={100}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="h-9 bg-background/60"
          />
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Investindo{" "}
          <span className="font-mono text-foreground">{formatBRL(amount)}</span> hoje, em
          12 meses você teria aproximadamente{" "}
          <span className="font-display text-base font-semibold text-foreground">
            {formatBRL(projection)}
          </span>
          .
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={() => onInterest(opportunity)}
        className="w-full bg-foreground text-background hover:bg-foreground/90 group/btn"
      >
        Tenho Interesse
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
      </Button>
    </article>
  );
}
