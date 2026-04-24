import { useState } from "react";
import { Sparkles } from "lucide-react";
import OpportunityCard from "@/components/OpportunityCard";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import FooterFeed from "@/components/FooterFeed";
import { OPPORTUNITIES, type Opportunity } from "@/data/opportunities";

export default function Oportunidades() {
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);

  function handleInterest(op: Opportunity) {
    setSelected(op);
    setOpen(true);
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[640px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24 relative space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                Curadoria Proprietária
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05] max-w-3xl mx-auto">
              Oportunidades de{" "}
              <span className="text-accent">Diversificação Estratégica</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Ativos descorrelacionados do ciclo tradicional do IBOV e da Selic,
              selecionados para maximizar o <span className="text-foreground">Alpha</span>{" "}
              da sua carteira sem multiplicar o risco.
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="container max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {OPPORTUNITIES.map((op) => (
              <OpportunityCard
                key={op.id}
                opportunity={op}
                onInterest={handleInterest}
              />
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            As projeções apresentadas são estimativas baseadas em retornos históricos e
            não constituem garantia de rentabilidade futura. Consulte sempre um
            profissional certificado antes de investir.
          </p>
        </section>
      </main>

      <FooterFeed />

      <LeadCaptureModal
        open={open}
        onOpenChange={setOpen}
        opportunityTitle={selected?.title ?? ""}
      />
    </div>
  );
}
