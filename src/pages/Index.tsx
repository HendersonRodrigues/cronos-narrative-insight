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
import { History, MessageSquare, ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { profile, setProfile, sessionId } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Função para buscar histórico real do Supabase
  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    
    const { data, error } = await supabase
      .from("user_analytics")
      .select("query_text, selected_profile, payload, created_at")
      .eq("user_id", user.id)
      .eq("event_type", "ai_insight") // Filtra apenas respostas da IA
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentSearches(data);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  function handleAsk(message: string) {
  setLastQuestion(message);
  
  if (user && supabase) {
    // IMPORTANTE: Garantir que o user_id seja enviado
    supabase.from("user_analytics").insert({
      user_id: user.id, // Aqui está a chave!
      query_text: message,
      selected_profile: profile,
      event_type: "consultoria_query", // Log da pergunta
      session_id: sessionId,
      payload: { source: "home_chat" },
    }).then(({ error }) => {
      if (error) console.error("Erro ao logar consulta:", error.message);
    });
  }
  
  brain.mutate({ 
    message, 
    profile, 
    userId: user?.id 
  }, {
    onSuccess: () => {
      // Esperamos 1.5 segundos para dar tempo da Edge Function terminar o insert
      // e então atualizamos os cards na tela
      setTimeout(() => {
        fetchHistory();
      }, 1500);
    }
  });
}

  // Layout para usuário NÃO Logado (mantido)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader />
        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-10">
          <DailyBriefing />
          <MarketDashboard />
          <ProfileLens profile={profile} onChange={setProfile} />
          <ConsultoriaInteligente profile={profile} isLoading={brain.isPending} onSubmit={handleAsk} />
          <ResponseDisplay isLoading={brain.isPending} error={brain.error as Error | null} answer={brain.data?.answer ?? null} question={lastQuestion} />
          <MonetizationBanner />
        </main>
        <FooterFeed />
      </div>
    );
  }

  // Layout para usuário LOGADO (Ajustado)
  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-8">
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Boas-vindas, {user.email?.split('@')[0]}
              </h1>
              <p className="text-muted-foreground">
                Sua inteligência estratégica para o mercado financeiro.
              </p>
            </div>
          </section>

          {/* Seção de Buscas Recentes com Design Premium */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="w-4 h-4" />
              <h2 className="text-sm font-medium uppercase tracking-wider">Insights Recentes</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.length > 0 ? (
                recentSearches.map((item, idx) => (
                  <Card 
                    key={idx} 
                    className="p-4 border-border/40 bg-card/40 hover:bg-card/80 transition-colors cursor-pointer group"
                    onClick={() => handleAsk(item.query_text)}
                  >
                    <div className="flex flex-col h-full justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-background">
                            {item.selected_profile}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          "{item.query_text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
                        Rever análise <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-border/20 rounded-xl">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma busca recente encontrada.</p>
                </div>
              )}
            </div>
          </section>

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
