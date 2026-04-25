/**
 * SmartPasteManager — Etapa 3.1 do Plano Cronos.
 *
 * Permite ao admin colar um texto bruto e obter, via edge function
 * `process-admin-insight`, uma extração estruturada (summary,
 * details_content, deep_analysis, assets_linked).
 *
 * O componente NÃO persiste no banco: exibe um Preview Sandbox que
 * simula o card final do usuário, com a seção [DETALHES] dentro de um
 * Accordion (escondida por padrão).
 *
 * Segurança:
 *   - A edge function exige JWT + role 'admin' (defesa em profundidade).
 *   - A aba só aparece para admins no painel (ProtectedRoute adminOnly).
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  ClipboardPaste,
  Loader2,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";

interface ExtractedInsight {
  summary: string;
  details_content: string;
  deep_analysis: string;
  assets_linked: string[];
}

const MIN_CHARS = 80;

export default function SmartPasteManager() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedInsight | null>(null);

  const charCount = rawText.trim().length;
  const canSubmit = isAdmin && !loading && charCount >= MIN_CHARS;

  const handleProcess = async () => {
    if (!supabase) {
      toast({
        title: "Cloud indisponível",
        description: "Conexão com o Lovable Cloud não inicializada.",
        variant: "destructive",
      });
      return;
    }
    if (!isAdmin) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem processar insights.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "process-admin-insight",
        { body: { text: rawText.trim() } },
      );
      if (error) throw error;
      const extracted = (data as { extracted?: ExtractedInsight })?.extracted;
      if (!extracted?.summary) {
        throw new Error("Resposta da IA sem conteúdo estruturado.");
      }
      setResult(extracted);
      toast({ title: "Insight processado com sucesso." });
    } catch (e) {
      const message = (e as Error).message ?? "Erro desconhecido.";
      toast({
        title: "Falha ao processar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRawText("");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Smart-Paste
              </CardTitle>
              <CardDescription>
                Cole um relatório, transcrição ou análise bruta. A IA extrai
                resumo, detalhes técnicos e ativos vinculados no formato
                Cronos. Nada é salvo automaticamente — revise no Preview
                abaixo.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Etapa 3.1
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="smart-paste-text">Texto bruto</Label>
            <Textarea
              id="smart-paste-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui o relatório, análise ou transcrição que deseja transformar em insight estruturado..."
              rows={10}
              className="resize-y font-mono text-[13px] leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Mínimo {MIN_CHARS} caracteres • até 12.000 por requisição
              </span>
              <span
                className={
                  charCount > 0 && charCount < MIN_CHARS
                    ? "text-destructive"
                    : ""
                }
              >
                {charCount.toLocaleString("pt-BR")} caracteres
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleProcess}
              disabled={!canSubmit}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Processando..." : "Processar com IA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              disabled={loading || (!rawText && !result)}
              className="gap-1.5"
            >
              <ClipboardPaste className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && <PreviewSandbox extracted={result} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Sandbox — simula o card visto pelo usuário final
// ---------------------------------------------------------------------------

function PreviewSandbox({ extracted }: { extracted: ExtractedInsight }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
          Preview Sandbox
        </span>
        <span className="text-xs text-muted-foreground">
          Pré-visualização do card final
        </span>
      </div>

      <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Cronos Brain
            </span>
          </div>

          {/* INSIGHT RÁPIDO */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                Insight Rápido
              </span>
            </div>
            <div className="prose-cronos text-base md:text-[17px] leading-[1.8] text-foreground/95 font-display">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {extracted.summary || "_Resumo não disponível._"}
              </ReactMarkdown>
            </div>
          </section>

          {/* ATIVOS VINCULADOS */}
          {extracted.assets_linked.length > 0 && (
            <section className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ativos vinculados
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extracted.assets_linked.map((asset) => (
                  <Badge
                    key={asset}
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {asset}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* ANÁLISE TÉCNICA — Accordion (escondido por padrão) */}
          {(extracted.details_content || extracted.deep_analysis) && (
            <Accordion
              type="single"
              collapsible
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
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {extracted.details_content && (
                    <div className="rounded-md border border-border/40 bg-background/40 p-4 font-mono text-[13px] leading-[1.7] text-muted-foreground prose-cronos prose-sm">
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">
                        Detalhes
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {extracted.details_content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {extracted.deep_analysis && (
                    <div className="rounded-md border border-border/40 bg-background/40 p-4 font-mono text-[13px] leading-[1.7] text-muted-foreground prose-cronos prose-sm">
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">
                        Análise Profunda
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {extracted.deep_analysis}
                      </ReactMarkdown>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </Card>
    </div>
  );
}
