import { useState, useEffect, useCallback } from "react";
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
import { resolveDisplayName } from "@/lib/displayName";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { History, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, profileData } = useAuth();
  const { profile, setProfile, sessionId } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Memorizamos a função para evitar re-renderizações infinitas
  const fetchHistory = useCallback(async () => {
    if (!user?.id || !supabase) return;
    
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from("user_analytics")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_type", "ai_insight")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error) setRecentSearches(data || []);
    setIsLoadingHistory(false);
  }, [user?.id]);

  useEffect(() => {
    if (user && !loading) {
      fetchHistory();
    }
  }, [user, loading, fetchHistory]);

  function handleAsk(message: string) {
    if (!message.trim() || brain.isPending) return;
    
    setLastQuestion(message);

    // Chamamos a IA — userId é injetado pela própria sessão na Edge Function.
    brain.mutate({ message, profile }, {
      onSuccess: () => {
        // Delay para o banco processar a escrita da Edge Function
        setTimeout(fetchHistory, 2500);
      }
    });
  }

  // Enquanto o Auth carrega, evitamos mostrar a landing page por erro
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader />
        <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-10">
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

// Saudação: prioriza full_name; cai para e-mail (truncado se > 20 chars).
const welcomeName = resolveDisplayName(profileData?.full_name, user?.email);

return (
  <DashboardLayout>
    <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
      <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-8">
        <section className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight italic">
            Boas-vindas, {welcomeName}
          </h1>
          <p className="text-muted-foreground">Analise o mercado com precisão estratégica.</p>
        </section>

          {/* Grid de Histórico Real */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="w-4 h-4" />
              <h2 className="text-sm font-medium uppercase tracking-wider">Últimos Insights</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-4 border-border/40 bg-card/40 hover:bg-card/80 transition-all cursor-pointer group"
                    onClick={() => handleAsk(item.query_text)}
                  >
                    <div className="flex flex-col h-full justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[10px] uppercase">{item.selected_profile}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          "{item.query_text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-all">
                        Ver análise <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-border/10 rounded-xl">
                  <p className="text-sm text-muted-foreground italic">Seu histórico aparecerá aqui após sua primeira consulta.</p>
                </div>
              )}
            </div>
          </section>

          <hr className="border-border/10" />
          <ProfileLens profile={profile} onChange={setProfile} />
          <ConsultoriaInteligente profile={profile} isLoading={brain.isPending} onSubmit={handleAsk} />
          <ResponseDisplay isLoading={brain.isPending} error={brain.error as Error | null} answer={brain.data?.answer ?? null} question={lastQuestion} />
        </main>
        <FooterFeed />
      </div>
    </DashboardLayout>
  );
};

export default Index;
