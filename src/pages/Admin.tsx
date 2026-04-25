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
} from "lucide-react";

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
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
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
        <TabsList className="grid w-full grid-cols-2 max-w-[420px] mb-6">
          <TabsTrigger value="leads">Leads recentes</TabsTrigger>
          <TabsTrigger value="insights">Consultas recentes</TabsTrigger>
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
                  icon={<MessageSquare className="h-8 w-8" />}
                  label="Nenhum lead capturado ainda."
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
                  icon={<Sparkles className="h-8 w-8" />}
                  label="Nenhuma consulta registrada ainda."
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

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  );
}
