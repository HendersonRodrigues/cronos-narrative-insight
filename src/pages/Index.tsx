import { useState, useEffect } from "react";
import CronosHeader from "@/components/CronosHeader";
import DailyBriefing from "@/components/DailyBriefing";
import MarketDashboard from "@/components/MarketDashboard";
import ProfileLens from "@/components/ProfileLens";
import ConsultoriaInteligente from "@/components/ConsultoriaInteligente";
import ResponseDisplay from "@/components/ResponseDisplay";
import MonetizationBanner from "@/components/MonetizationBanner";
import FooterFeed from "@/components/FooterFeed";
import { useProfile } from "@/hooks/useProfile";
import { useCronosBrain } from "@/hooks/useCronosBrain";
import { logQuery } from "@/services/analyticsService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { History, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { profile, setProfile, sessionId } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Busca o histórico real do banco filtrando por usuário e tipo de evento
  const fetchHistory = async () => {
    if (!user || !supabase) return;
    setIsLoadingHistory(true);
    
    try {
      const { data, error } = await supabase
        .from("user_analytics")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_type", "ai_insight") // Filtra apenas as respostas consolidadas da IA
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSearches(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  function handleAsk(message: string) {
  if (!message.trim()) return;
  setLastQuestion(message);
  
  // LOG DE DEBUG: Verifique se o user.id aparece no seu console do navegador
  console.log("Usuário logado disparando pergunta:", user?.id);

  brain.mutate({ 
    message, 
    profile, 
    userId: user?.id // Enviamos explicitamente para a Edge Function
  }, {
    onSuccess: () => {
      setTimeout(fetchHistory, 2500); // Aumentamos um pouco o tempo para o banco processar
    }
  });
}

  // View para Usuário Visitante (Landing Page)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader />
        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-10">
          <DailyBriefing />
          <MarketDashboard />
          <ProfileLens profile={profile} onChange={setProfile} />
          <ConsultoriaInteligente profile={profile} isLoading={brain.isPending} onSubmit={handleAsk} />
          <ResponseDisplay 
            isLoading={brain.isPending} 
            error={brain.error as Error | null} 
            answer={brain.data?.answer ?? null} 
            question={lastQuestion} 
          />
          <MonetizationBanner />
        </main>
        <FooterFeed />
      </div>
    );
  }

  // View para Usuário Logado (Dashboard)
  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-8">
          
          <section className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Boas-vindas, {user.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground">
              Sua inteligência estratégica para o mercado financeiro.
            </p>
          </section>

          {/* Cards de Insights Recentes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <History className="w-4 h-4" />
                <h2 className="text-sm font-medium uppercase tracking-wider">Insights Recentes</h2>
              </div>
              {isLoadingHistory && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-4 border-border/40 bg-card/40 hover:bg-card/80 transition-all cursor-pointer group hover:border-primary/30"
                    onClick={() => handleAsk(item.query_text)}
                  >
                    <div className="flex flex-col h-full justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0">
                            {item.selected_profile}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors italic">
                          "{item.query_text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Refazer consulta <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : !isLoadingHistory && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-border/10 rounded-xl bg-muted/5">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Você ainda não possui consultas salvas.</p>
                </div>
              )}
            </div>
          </section>

          <hr className="border-border/40" />

          <ProfileLens profile={profile} onChange={setProfile} />

          <ConsultoriaInteligente
            profile={profile}
            isLoading={brain.isPending}
            onSubmit={handleAsk}
          />

          <ResponseDisplay
            isLoading={brain.isPending}
            error={brain.error as Error | null}
            answer={brain.data?.answer ?? null}
            question={lastQuestion}
          />
        </main>
        <FooterFeed />
      </div>
    </DashboardLayout>
  );
};

export default Index;
