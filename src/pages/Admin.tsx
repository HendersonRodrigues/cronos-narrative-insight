import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminQuestions,
  useAdminOpportunities,
} from "@/hooks/useAdminContent";
import type { RiskLevel } from "@/types/database";
import {
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Users,
  Loader2,
  Sparkles,
  HelpCircle,
  Briefcase,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EmptyState from "@/components/EmptyState";
import SmartPasteManager from "@/components/admin/SmartPasteManager";

interface LeadRow {
  id: string;
  full_name: string;
  whatsapp: string;
  opportunity_name: string;
  status: string | null;
  created_at: string;
}

interface InsightRow {
  id: string;
  query_text: string | null;
  selected_profile: string | null;
  created_at: string;
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, leads: 0, insights: 0 });
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [insights, setInsights] = useState<InsightRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      if (!supabase) return;
      setLoading(true);

      const [usersRes, leadsCountRes, insightsCountRes, leadsRes, insightsRes] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("leads").select("*", { count: "exact", head: true }),
          supabase
            .from("user_analytics")
            .select("*", { count: "exact", head: true })
            .eq("event_type", "ai_insight"),
          supabase
            .from("leads")
            .select("id, full_name, whatsapp, opportunity_name, status, created_at")
            .order("created_at", { ascending: false })
            .limit(15),
          supabase
            .from("user_analytics")
            .select("id, query_text, selected_profile, created_at")
            .eq("event_type", "ai_insight")
            .order("created_at", { ascending: false })
            .limit(15),
        ]);

      if (!mounted) return;

      setStats({
        users: usersRes.count ?? 0,
        leads: leadsCountRes.count ?? 0,
        insights: insightsCountRes.count ?? 0,
      });
      setLeads((leadsRes.data ?? []) as LeadRow[]);
      setInsights((insightsRes.data ?? []) as InsightRow[]);
      setLoading(false);
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/oportunidades">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-muted-foreground">
          Métricas em tempo real da Cronos — usuários, leads e consultas à IA.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Usuários cadastrados"
          value={stats.users}
          icon={<Users className="h-4 w-4 text-accent" />}
          loading={loading}
        />
        <StatCard
          title="Leads capturados"
          value={stats.leads}
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          loading={loading}
        />
        <StatCard
          title="Consultas à IA"
          value={stats.insights}
          icon={<Sparkles className="h-4 w-4 text-blue-500" />}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 max-w-[900px] mb-6">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="insights">Consultas</TabsTrigger>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="smart-paste" className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Smart-Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Leads recentes</CardTitle>
              <CardDescription>
                Últimos 15 interesses capturados nas oportunidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState label="Carregando leads..." />
              ) : leads.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Nenhum lead capturado ainda"
                  description="Os primeiros interesses cadastrados aparecerão nesta lista."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Oportunidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.full_name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {lead.whatsapp}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.opportunity_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {lead.status ?? "novo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Consultas recentes à IA</CardTitle>
              <CardDescription>
                Últimas 15 perguntas feitas ao Cronos Brain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState label="Carregando consultas..." />
              ) : insights.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Nenhuma consulta registrada"
                  description="Quando os usuários consultarem o Cronos Brain, as perguntas aparecerão aqui."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pergunta</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-md">
                          <span className="line-clamp-2 text-sm">
                            {row.query_text ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {row.selected_profile ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(row.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsManager />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunitiesManager />
        </TabsContent>

        <TabsContent value="smart-paste">
          <SmartPasteManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionsManager — CRUD de app_questions
// ---------------------------------------------------------------------------
function QuestionsManager() {
  const { data, loading, error, add, toggle, remove } = useAdminQuestions();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await add({
        text: text.trim(),
        category: category.trim() || null,
        is_active: true,
        order_index: 0,
      });
      setText("");
      setCategory("");
      toast({ title: "Pergunta adicionada com sucesso." });
    } catch (e) {
      toast({
        title: "Erro ao adicionar",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      toast({ title: "Pergunta removida." });
    } catch (e) {
      toast({
        title: "Erro ao remover",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Perguntas do app</CardTitle>
        <CardDescription>
          Gerencie as perguntas dinâmicas exibidas para os usuários. Desative
          temporariamente com o switch ou remova permanentemente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="q-text">Texto da pergunta</Label>
            <Input
              id="q-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex.: Qual seu objetivo de investimento?"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-cat">Categoria</Label>
            <Input
              id="q-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <Button type="submit" disabled={submitting} className="self-end gap-1.5">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </form>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border/40 bg-card/40 p-3"
              >
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-10 animate-pulse rounded bg-muted" />
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="h-5 w-5" />}
            title="Nenhuma pergunta cadastrada"
            description="Adicione perguntas inteligentes acima para que apareçam no app dos usuários."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="w-[100px]">Ativa</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">{row.text}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {row.category ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(v) => toggle(row.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === row.id}
                          aria-label="Excluir pergunta"
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A pergunta
                            <span className="mx-1 font-medium text-foreground">
                              "{row.text}"
                            </span>
                            será removida permanentemente do banco.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(row.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// OpportunitiesManager — CRUD de investment_opportunities
// ---------------------------------------------------------------------------
function OpportunitiesManager() {
  const { data, loading, error, add, toggle } = useAdminOpportunities();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [returnRate, setReturnRate] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medio");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await add({
        name: name.trim(),
        description: description.trim() || null,
        return_rate: returnRate ? Number(returnRate) / 100 : null,
        risk_level: riskLevel,
        is_active: true,
        category: null,
        min_investment: null,
      });
      setName("");
      setDescription("");
      setReturnRate("");
      setRiskLevel("medio");
      toast({ title: "Oportunidade criada com sucesso." });
    } catch (e) {
      toast({
        title: "Erro ao criar oportunidade",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Oportunidades de investimento</CardTitle>
        <CardDescription>
          Catálogo exibido na página de diversificação estratégica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="o-name">Nome</Label>
            <Input
              id="o-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Consórcio Estruturado"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-rate">Retorno esperado (% a.a.)</Label>
            <Input
              id="o-rate"
              type="number"
              step="0.01"
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
              placeholder="Ex.: 18"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="o-desc">Descrição</Label>
            <Textarea
              id="o-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo executivo da oportunidade..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-risk">Nível de risco</Label>
            <Select
              value={riskLevel}
              onValueChange={(v) => setRiskLevel(v as RiskLevel)}
            >
              <SelectTrigger id="o-risk">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="self-end gap-1.5 md:col-start-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar oportunidade
          </Button>
        </form>

        {loading ? (
          <LoadingState label="Carregando oportunidades..." />
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="Nenhuma oportunidade cadastrada"
            description="Adicione a primeira oportunidade no formulário acima para que apareça em /oportunidades."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead className="w-[120px]">Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {row.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.return_rate != null
                      ? `${(row.return_rate * 100).toFixed(2)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(v) => toggle(row.id, v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
