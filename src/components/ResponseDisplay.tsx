import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Brain, AlertCircle, Terminal, Activity } from "lucide-react";

const STATUS_MESSAGES = [
  "Cronos está cruzando dados do S&P 500…",
  "Calculando correlações com o Ibovespa…",
  "Analisando fluxo do DXY e treasuries…",
  "Mapeando a curva de juros brasileira…",
  "Cruzando IPCA com expectativas Focus…",
  "Lendo o tape do book institucional…",
  "Sintetizando narrativas macro globais…",
  "Calibrando o cenário pelo seu perfil…",
];
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  isLoading: boolean;
  error: Error | null;
  answer: string | null;
  question: string | null;
}

export default function ResponseDisplay({ isLoading, error, answer, question }: Props) {
  const [accordionValue, setAccordionValue] = useState<string>("");

  // Fecha o accordion ao iniciar uma nova consulta
  useEffect(() => {
    if (isLoading) setAccordionValue("");
  }, [isLoading]);

  if (!isLoading && !error && !answer) return null;

  // Divide a resposta no marcador [DETALHES] APENAS quando ele existir.
  // Caso contrário, renderiza a resposta integralmente como Insight Rápido.
  const hasDetails = typeof answer === "string" && answer.includes("[DETALHES]");
  const [resumoRaw = "", detalhesRaw = ""] = hasDetails
    ? (answer as string).split("[DETALHES]")
    : [answer ?? "", ""];
  const resumo = resumoRaw.trim();
  const detalhes = detalhesRaw.trim();

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="p-6 md:p-8 space-y-5">
        {question && (
          <div className="flex items-start gap-3 pb-4 border-b border-border/40">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
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
                processando análise…
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
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-5">
            {/* INSIGHT RÁPIDO — tipografia amigável e espaçada */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                  Insight Rápido
                </span>
              </div>
              <div className="prose-cronos text-base md:text-[17px] leading-[1.8] text-foreground/95 font-display">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumo}</ReactMarkdown>
              </div>
            </section>

            {/* ANÁLISE TÉCNICA — accordion, tom sóbrio, mono */}
            {detalhes && (
              <Accordion
                type="single"
                collapsible
                value={accordionValue}
                onValueChange={setAccordionValue}
                className="rounded-lg border border-border/50 bg-muted/10"
              >
                <AccordionItem value="detalhes" className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-primary transition-colors">
                        Análise Técnica Completa
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="rounded-md border border-border/40 bg-background/40 p-4 font-mono text-[13px] leading-[1.7] text-muted-foreground prose-cronos prose-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{detalhes}</ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
