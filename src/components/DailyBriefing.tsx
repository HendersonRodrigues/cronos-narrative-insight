import { useEffect } from "react";
import { Sparkles, Calendar, AlertCircle, Loader2, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { useDailyBriefing } from "@/hooks/useDailyBriefing";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatDateLong } from "@/lib/format";

export default function DailyBriefing() {
  const { data, isLoading, error } = useDailyBriefing();
  const qc = useQueryClient();

  // Realtime: novo briefing inserido pelo cron → invalida a query
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("daily_briefing_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "daily_briefing" },
        () => {
          qc.invalidateQueries({ queryKey: ["daily_briefing", "latest"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "daily_briefing" },
        () => {
          qc.invalidateQueries({ queryKey: ["daily_briefing", "latest"] });
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [qc]);

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm glow-primary">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1">
            <Brain className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Análise do Cronos
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Insight do Dia
            </span>
          </div>
          {data?.date && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {formatDateLong(data.date)}
              </span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
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
          <div className="space-y-3"> {/* Reduzido de space-y-4 para mais densidade */}
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              {data.title}
            </h2>
            
            {/* Ajuste na escala do texto do Markdown para ser mais sutil */}
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-foreground/80 prose-strong:text-primary/90">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>

            {data.profile_type && data.profile_type !== "geral" && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 border border-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-secondary-foreground">
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
