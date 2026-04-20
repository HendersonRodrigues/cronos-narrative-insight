import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Brain, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  isLoading: boolean;
  error: Error | null;
  answer: string | null;
  question: string | null;
}

export default function ResponseDisplay({ isLoading, error, answer, question }: Props) {
  if (!isLoading && !error && !answer) return null;

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="p-6 md:p-8 space-y-4">
        {question && (
          <div className="flex items-start gap-3 pb-4 border-b border-border/40">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-primary-soft">
              <span className="font-mono text-[10px] uppercase text-primary">você</span>
            </div>
            <p className="text-sm text-foreground/90 italic leading-relaxed">"{question}"</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Cronos Brain
          </span>
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                processando…
              </span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3 py-2">
            <div className="h-4 w-11/12 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-10/12 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-9/12 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-8/12 rounded bg-muted/40 animate-pulse" />
            <p className="pt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground animate-pulse">
              Cronos está cruzando dados de mercado e ciclos históricos…
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-destructive">
                Falha na consulta
              </p>
              <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && answer && (
          <div className="prose-cronos animate-in fade-in slide-in-from-bottom-2 duration-500">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
        )}
      </div>
    </Card>
  );
}
