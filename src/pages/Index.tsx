import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { resolveDisplayName } from "@/lib/displayName";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

// Hook para buscar histórico (apenas para logados)
function useInsightHistory(userId?: string) {
  return useQuery({
    queryKey: ["insight_history", userId],
    enabled: Boolean(userId && supabase),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from("user_analytics")
        .select("id, query_text, selected_profile, created_at, payload")
        .eq("user_id", userId)
        .eq("event_type", "ai_insight")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const Index = () => {
  const { user, loading, profileData } = useAuth();
  const { profile, setProfile } = useProfile();
  const brain = useCronosBrain();
  const queryClient = useQueryClient();
  
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [cachedAnswer, setCachedAnswer] = useState<string | null>(null);
  const [expirationInfo, setExpirationInfo] = useState<{ expired: boolean; date: string | null }>({ 
    expired: false, 
    date: null 
  });

  const history = useInsightHistory(user?.id);

  // Manipula clique no histórico
  const handleHistoryClick = (item: any) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const hoursOld = Math.abs(Date.now() - new Date(item.created_at).getTime()) / 36e5;
    
    setLastQuestion(item.query_text);
    setCachedAnswer(item.payload?.answer || item.payload);
    setExpirationInfo({ 
      expired: hoursOld > 48, 
      date: formattedDate 
    });

    // Scroll suave para a resposta
    setTimeout(() => {
      document.getElementById("response-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  function handleAsk(message: string) {
    if (!message.trim() || brain.isPending) return;
    
    setLastQuestion(message);
    setCachedAnswer(null);
    setExpirationInfo({ expired: false, date: null });
    
    brain.mutate(
      { message, profile },
      {
        onSuccess: () => {
          if (user) {
            queryClient.invalidateQueries({ queryKey: ["insight_history", user?.id] });
          }
          setTimeout(() => {
            document.getElementById("response-area")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
      },
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
      </div>
    );
  }

  const MainContent = () => (
    <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-10">
      {/* 1. Insight do Dia */}
      <DailyBriefing />
      
      {/* 2. Painel de Mercado */}
      <MarketDashboard />
      
      <hr className="border-border/5" />

      {/* 3. Consultoria Inteligente */}
      <section className="space-y-6">
        <ProfileLens profile={profile} onChange={setProfile} />
        <ConsultoriaInteligente
          profile={profile}
          isLoading={brain.isPending}
          onSubmit={handleAsk}
        />
      </section>

      {/* 4. Histórico de Consultas (Tabela) */}
      {user && history.data && history.data.length > 0 && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-80">Histórico de Consultas</h2>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/20 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Perfil</th>
                  <th className="px-4 py-3 font-medium">Consulta</th>
                  <th className="px-4 py-3 font-medium text-right">Realizada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.data.map((item: any) => (
                  <tr 
                    key={item.id} 
                    className="group cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary/80">
                        {item.selected_profile}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground/80 truncate max-w-[300px] md:max-w-[500px]">
                      {item.query_text}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-[10px] font-mono">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. Exibição da Resposta */}
      <div id="response-area" className="scroll-mt-10">
        <AnimatePresence mode="wait">
          {lastQuestion && (
            <motion.div
              key={lastQuestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ResponseDisplay
                isLoading={brain.isPending}
                error={brain.error as Error | null}
                answer={cachedAnswer || brain.data?.answer || null}
                question={lastQuestion}
              />
              {expirationInfo.expired && cachedAnswer && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-md bg-caution/10 border border-caution/20 text-caution text-[11px] font-mono uppercase tracking-wider">
                  <span className="shrink-0">⚠️</span>
                  <span>
                    Análise realizada em <strong>{expirationInfo.date}</strong>. 
                    O cenário macro pode ter sofrido alterações significativas desde então.
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Oportunidade Estratégica */}
      <MonetizationBanner />
    </main>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader showLoginButton={true} /> 
        <MainContent />
        <FooterFeed />
      </div>
    );
  }

  const welcomeName = resolveDisplayName(profileData?.full_name, user?.email);

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
        <header className="container max-w-[1200px] mx-auto px-4 pt-8">
          <h1 className="text-3xl font-medium tracking-tight">
            Boas-vindas, <span className="text-primary">{welcomeName}</span>
          </h1>
          <p className="text-muted-foreground">Estratégia e precisão para seus investimentos.</p>
        </header>
        <MainContent />
        <FooterFeed />
      </div>
    </DashboardLayout>
  );
};

export default Index;
