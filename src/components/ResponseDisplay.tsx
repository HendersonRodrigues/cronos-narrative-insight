import React, { useState, useEffect } from "react"; // Adicionei useState e useEffect
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Brain, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"; // Adicionei ícones de seta
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Verifique se você tem esse componente de botão

interface Props {
  isLoading: boolean;
  error: Error | null;
  answer: string | null;
  question: string | null;
}

export default function ResponseDisplay({ isLoading, error, answer, question }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Resetar a expansão quando uma nova pergunta for feita
  useEffect(() => {
    if (isLoading) setIsExpanded(false);
  }, [isLoading]);

  if (!isLoading && !error && !answer) return null;

  // Lógica para separar o texto
  const parts = answer ? answer.split("[DETALHES]") : [];
  const resumo = parts[0];
  const detalhes = parts[1];

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="p-6 md:p-8 space-y-4">
        {/* ... (Parte do Código de Pergunta "você" - Mantém igual) */}
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
          {/* ... (Loading indicador - Mantém igual) */}
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                processando…
              </span>
            </div>
          )}
        </div>

        {/* ... (Skeletons de Loading e Erro - Mantém igual) */}
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
              <p className="font-mono text-xs uppercase tracking-wider text-destructive">Falha na consulta</p>
              <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        {/* --- NOVA LÓGICA DE RESPOSTA --- */}
        {!isLoading && !error && answer && (
          <div className="prose-cronos animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Renderiza o Resumo sempre */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumo}</ReactMarkdown>

            {/* Se houver detalhes, mostra o botão e o conteúdo expansível */}
            {detalhes && (
              <div className="mt-4 pt-4 border-t border-border/20">
                {!isExpanded ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(true)}
                    className="group h-8 px-2 text-xs font-mono uppercase tracking-widest text-primary/70 hover:text-primary"
                  >
                    <ChevronDown className="mr-2 h-3 w-3 transition-transform group-hover:translate-y-0.5" />
                    Deseja continuar lendo?
                  </Button>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{detalhes}</ReactMarkdown>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsExpanded(false)}
                      className="mt-4 h-8 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                    >
                      <ChevronUp className="mr-2 h-3 w-3" />
                      Ocultar análise completa
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
