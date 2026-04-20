import { Sparkles, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { useDailyBriefing } from "@/hooks/useDailyBriefing";
import { Card } from "@/components/ui/card";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DailyBriefing() {
  const { data, isLoading, error } = useDailyBriefing();

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm glow-primary">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Insight do Dia
            </span>
          </div>
          {data?.date && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {formatDate(data.date)}
              </span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded bg-muted/50 animate-pulse" />
            <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-11/12 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-9/12 rounded bg-muted/40 animate-pulse" />
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="font-mono uppercase tracking-wider">
                Carregando análise macro…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-destructive">
                Falha ao carregar briefing
              </p>
              <p className="text-xs text-destructive/80 mt-1">{(error as Error).message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && !data && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Nenhum briefing disponível no momento
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              {data.title}
            </h2>
            <p className="text-base leading-relaxed text-foreground/85 whitespace-pre-line">
              {data.content}
            </p>
            {data.profile_type && data.profile_type !== "geral" && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary-foreground">
                  Foco · {data.profile_type}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
