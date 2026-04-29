import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, Briefcase } from "lucide-react";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityCardSkeleton from "@/components/OpportunityCardSkeleton";
import EmptyState from "@/components/EmptyState";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import FooterFeed from "@/components/FooterFeed";
import type { Opportunity, OpportunityAccent } from "@/data/opportunities";
import type { InvestmentOpportunityRow } from "@/types/database";

/**
 * Adaptador DB -> UI.
 *
 * O schema do banco (`investment_opportunities`) usa `name`/`description`/
 * `return_rate`/`risk_level`/`summary`. O componente `OpportunityCard` foi
 * desenhado em cima do tipo estático `Opportunity` (data/opportunities.ts)
 * com `title`/`category`/`annualReturn`/`highlight`/etc.
 *
 * Esta função faz a ponte para evitar refator do card e manter a baseline.
 */
const ACCENTS: OpportunityAccent[] = ["gold", "graphite", "navy"];

function riskToLabel(risk?: string | null): string {
  switch ((risk ?? "medio").toLowerCase()) {
    case "baixo":
      return "Risco Baixo";
    case "alto":
      return "Risco Alto";
    default:
      return "Risco Moderado";
  }
}

function mapRowToOpportunity(
  row: InvestmentOpportunityRow,
  index: number,
): Opportunity {
  const annualReturn =
    row.return_rate != null ? Number(row.return_rate) * 100 : 0;
  return {
    id: row.id,
    title: row.name ?? "Oportunidade",
    category: row.category ?? "Curadoria Cronos",
    description: row.summary ?? row.description ?? "",
    thesis: row.deep_analysis ?? row.details_content ?? "",
    annualReturn,
    highlight: `${annualReturn.toFixed(1)}% a.a.`,
    riskLabel: riskToLabel(row.risk_level),
    horizon: "Médio / Longo prazo",
    accent: ACCENTS[index % ACCENTS.length],
    minMonths: 12,
    maxMonths: 60,
    comparisonCDI: 1.5,
  };
}

export default function Oportunidades() {
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Opportunity[]>([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("investment_opportunities")
          .select("*")
          .eq("is_active", true)
          // Tolerante a registros legados sem status/is_archived definidos:
          // exibe se NÃO está arquivado (is_archived = false OU NULL) e
          // status é 'published' OU NULL (criados antes da governance).
          .or("is_archived.is.null,is_archived.eq.false")
          .or("status.is.null,status.eq.published")
          .order("created_at", { ascending: false });

        if (error) throw error;
        const mapped = ((data ?? []) as InvestmentOpportunityRow[]).map(
          mapRowToOpportunity,
        );
        setItems(mapped);
      } catch (err) {
        console.error("Erro ao carregar oportunidades:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchOpportunities();
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  function handleInterest(op: Opportunity) {
    setSelected(op);
    setOpen(true);
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[640px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="container max-w-[1200px] mx-auto px-4 py-16 md:py-24 relative space-y-6 text-center">
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
              selecionados para maximizar o{" "}
              <span className="text-foreground">Alpha</span> da sua carteira sem
              multiplicar o risco.
            </p>
          </div>
        </section>

        <section className="container max-w-[1200px] mx-auto px-4 py-12 md:py-16">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <OpportunityCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-5 w-5" />}
              title="Nenhuma oportunidade disponível"
              description="Nossa curadoria ainda não publicou ativos para este momento. Volte em instantes ou cadastre seu interesse para ser avisado primeiro."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((op) => (
                <OpportunityCard
                  key={op.id}
                  opportunity={op}
                  onInterest={handleInterest}
                />
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            As projeções apresentadas são estimativas baseadas em retornos
            históricos e não constituem garantia de rentabilidade futura.
            Consulte sempre um profissional certificado antes de investir.
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
