import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LayoutDashboard, MessageSquare, TrendingUp, Users, Plus } from "lucide-react";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, opportunities: 0, questions: 0 });
  const [newQuestion, setNewQuestion] = useState("");

  // Carregar dados iniciais (Métricas)
  useEffect(() => {
    const fetchStats = async () => {
      const { count: userCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
      const { count: oppCount } = await supabase.from("investment_opportunities").select("*", { count: 'exact', head: true });
      const { count: questCount } = await supabase.from("app_questions").select("*", { count: 'exact', head: true });
      
      setStats({
        users: userCount || 0,
        opportunities: oppCount || 0,
        questions: questCount || 0
      });
    };
    fetchStats();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("app_questions")
      .insert([{ text: newQuestion, is_active: true }]);

    if (error) {
      toast.error("Erro ao adicionar pergunta");
    } else {
      toast.success("Pergunta adicionada com sucesso!");
      setNewQuestion("");
      setStats(prev => ({ ...prev, questions: prev.questions + 1 }));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground">Gerencie o conteúdo e visualize as métricas da Cronos.</p>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opportunities}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banco de Perguntas</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="content">Gerenciar Conteúdo</TabsTrigger>
          <TabsTrigger value="analytics">Métricas Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Formulário de Perguntas */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Nova Pergunta Inteligente</CardTitle>
                <CardDescription>Adicione perguntas que aparecerão para os usuários.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Texto da Pergunta</Label>
                    <Input 
                      id="question" 
                      placeholder="Ex: Como está a rentabilidade do CDB hoje?" 
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90">
                    {loading ? "Salvando..." : "Adicionar Pergunta"}
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Placeholder Oportunidades */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Nova Oportunidade</CardTitle>
                <CardDescription>Cadastre investimentos recomendados.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[160px] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">Formulário de oportunidades em breve...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Insights de Uso</CardTitle>
              <CardDescription>Aqui aparecerão os gráficos de cliques e interações.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <TrendingUp className="h-12 w-12 text-muted/20" />
              <p className="text-muted-foreground ml-4">Conectando ao banco de eventos...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
