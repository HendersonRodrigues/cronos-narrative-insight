/**
 * SmartPasteManager — Etapa 3.1/3.2 do Plano Cronos.
 *
 * Permite ao admin:
 *   1. Selecionar o DESTINO do insight (Briefing diário ou Oportunidade).
 *   2. Escolher o MODO: criar novo OU atualizar (substituir/arquivar) registro.
 *   3. Colar texto bruto e processar via edge function `process-admin-insight`.
 *   4. Visualizar o resultado em um Sandbox que simula o card final.
 *   5. Publicar (status='published') ou salvar como rascunho (status='draft').
 *
 * Persistência feita pela edge function `save-admin-insight`, que valida
 * role 'admin' e arquiva o registro anterior quando o modo é 'update'.
 */

import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Save,
  Send,
  Calendar,
  Activity,
  TrendingUp,
} from "lucide-react";
import StaleAssetsWarning from "./StaleAssetsWarning";

type Target = "briefing" | "opportunity";
type Mode = "create" | "update";

interface ExtractedInsight {
  summary: string;
  details_content: string;
  deep_analysis: string;
  assets_linked: string[];
  title?: string;
  market_sentiment?: string;
  trade_setup?: string;
}

interface ExistingRecord {
  id: string;
  label: string;
  status?: string;
  date?: string | null;
}

const MIN_CHARS = 80;

export default function SmartPasteManager() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [target, setTarget] = useState<Target>("briefing");
  const [mode, setMode] = useState<Mode>("create");
  const [replaceId, setReplaceId] = useState<string>("");
  const [existing, setExisting] = useState<ExistingRecord[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [rawText, setRawText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ExtractedInsight | null>(null);

  const charCount = rawText.trim().length;
  const canProcess = isAdmin && !processing && charCount >= MIN_CHARS;
  const canSave =
    isAdmin && !saving && !!result && (mode === "create" || !!replaceId);

  // ---------------- carrega registros para "Atualizar" ----------------
  useEffect(() => {
    if (mode !== "update" || !supabase) {
      setExisting([]);
      setReplaceId("");
      return;
    }
    let cancelled = false;
    setLoadingExisting(true);

    async function load() {
      try {
        if (target === "briefing") {
          const { data, error } = await supabase!
            .from("daily_briefing")
            .select("id, title, date, status")
            .neq("status", "archived")
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(20);
          if (error) throw error;
          if (cancelled) return;
          setExisting(
            (data ?? []).map((r) => ({
              id: r.id as string,
              label: `${r.title ?? "Briefing"} — ${r.date ?? "—"}`,
              status: r.status as string | undefined,
              date: r.date as string | null,
            })),
          );
        } else {
          const { data, error } = await supabase!
            .from("investment_opportunities")
            .select("id, name, status, is_archived, created_at")
            .eq("is_archived", false)
            .order("created_at", { ascending: false })
            .limit(30);
          if (error) throw error;
          if (cancelled) return;
          setExisting(
            (data ?? []).map((r) => ({
              id: r.id as string,
              label: r.name as string,
              status: r.status as string | undefined,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast({
            title: "Falha ao listar registros",
            description: (e as Error).message,
            variant: "destructive",
          });
          setExisting([]);
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, target, toast]);

  // ---------------- ações ----------------
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
    setProcessing(true);
    setResult(null);
    try {
      // Usamos fetch direto para conseguir ler o body de erro (4xx/5xx).
      // supabase.functions.invoke esconde o body quando status != 2xx.
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-admin-insight`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ text: rawText.trim(), target }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          payload?.error ||
          payload?.detail ||
          `Edge function ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      const extracted = (payload as { extracted?: ExtractedInsight })?.extracted;
      if (!extracted?.summary) {
        throw new Error("Resposta da IA sem conteúdo estruturado.");
      }
      setResult(extracted);
      toast({ title: "Insight processado." });
    } catch (e) {
      console.error("[SmartPaste] handleProcess error:", e);
      toast({
        title: "Falha ao processar",
        description: (e as Error).message ?? "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!result || !supabase) return;
    if (mode === "update" && !replaceId) {
      toast({
        title: "Selecione um registro",
        description: "Escolha qual registro será arquivado e substituído.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-admin-insight`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({
          target,
          mode,
          replace_id: mode === "update" ? replaceId : undefined,
          publish,
          insight: result,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data as { error?: string; detail?: string })?.error ||
          (data as { error?: string; detail?: string })?.detail ||
          `Edge function ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      const ok = (data as { ok?: boolean })?.ok;
      if (!ok) throw new Error("Resposta inesperada do servidor.");
      toast({
        title: publish ? "Publicado!" : "Rascunho salvo.",
        description: publish
          ? "O conteúdo já está visível para os usuários."
          : "Você pode revisá-lo antes de publicar.",
      });
      // Reset
      setResult(null);
      setRawText("");
      setReplaceId("");
    } catch (e) {
      toast({
        title: "Falha ao salvar",
        description: (e as Error).message ?? "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
                Cole um texto bruto, escolha o destino e processe com IA. Nada
                é publicado sem sua revisão no Preview Sandbox abaixo.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Etapa 3.2
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Destino + Modo */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Destino</Label>
              <Select
                value={target}
                onValueChange={(v) => {
                  setTarget(v as Target);
                  setReplaceId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="briefing">
                    Briefing diário (curto prazo / day trade)
                  </SelectItem>
                  <SelectItem value="opportunity">
                    Oportunidade (médio / longo prazo)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modo</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Criar novo</SelectItem>
                  <SelectItem value="update">
                    Atualizar existente (arquiva o anterior)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de registros para substituir */}
          {mode === "update" && (
            <div className="space-y-1.5">
              <Label>Registro a substituir</Label>
              <Select
                value={replaceId}
                onValueChange={setReplaceId}
                disabled={loadingExisting || existing.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingExisting
                        ? "Carregando..."
                        : existing.length === 0
                          ? "Nenhum registro disponível"
                          : "Selecione o registro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {existing.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <span>{r.label}</span>
                        {r.status && (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase tracking-wider"
                          >
                            {r.status}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                O registro selecionado será marcado como{" "}
                <span className="font-mono text-destructive/80">archived</span>{" "}
                ao publicar o novo.
              </p>
            </div>
          )}

          {/* Texto bruto */}
          <div className="space-y-1.5">
            <Label htmlFor="smart-paste-text">Texto bruto</Label>
            <Textarea
              id="smart-paste-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                target === "briefing"
                  ? "Cole notícias do dia, leitura macro, gatilhos para day trade..."
                  : "Cole a tese de investimento, fundamentos, números e contexto..."
              }
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
              disabled={!canProcess}
              className="gap-1.5"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {processing ? "Processando..." : "Processar com IA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              disabled={processing || (!rawText && !result)}
              className="gap-1.5"
            >
              <ClipboardPaste className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <StaleAssetsWarning assetsLinked={result.assets_linked ?? []} />
          <PreviewSandbox extracted={result} target={target} />

          <Card className="border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-xs text-muted-foreground">
                {mode === "update" && replaceId
                  ? "Ao publicar, o registro selecionado será arquivado."
                  : mode === "update"
                    ? "Selecione um registro para atualizar antes de publicar."
                    : "Será criado um novo registro."}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={!canSave}
                  className="gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar como rascunho
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={!canSave}
                  className="gap-1.5 bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  PUBLICAR AGORA
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Sandbox — simula o card visto pelo usuário final
// ---------------------------------------------------------------------------

function PreviewSandbox({
  extracted,
  target,
}: {
  extracted: ExtractedInsight;
  target: Target;
}) {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
          Preview Sandbox
        </span>
        <span className="text-xs text-muted-foreground">
          Simulação do card final ({target === "briefing" ? "Home" : "Oportunidades"})
        </span>
      </div>

      <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1">
              <Brain className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {target === "briefing" ? "Briefing do Dia" : "Tese Cronos"}
              </span>
            </div>
            {target === "briefing" && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {today}
                </span>
              </div>
            )}
          </div>

          {extracted.title && (
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              {extracted.title}
            </h2>
          )}

          {/* Sentimento + Setup (apenas briefing) */}
          {target === "briefing" &&
            (extracted.market_sentiment || extracted.trade_setup) && (
              <div className="grid gap-2 md:grid-cols-2">
                {extracted.market_sentiment && (
                  <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      Sentimento
                    </div>
                    <p className="text-sm text-foreground/90">
                      {extracted.market_sentiment}
                    </p>
                  </div>
                )}
                {extracted.trade_setup && (
                  <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Setup do dia
                    </div>
                    <p className="text-sm text-foreground/90">
                      {extracted.trade_setup}
                    </p>
                  </div>
                )}
              </div>
            )}

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

