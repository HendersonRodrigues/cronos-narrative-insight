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
import EmptyState from "@/components/EmptyState";
import { useProfile } from "@/hooks/useProfile";
import { useCronosBrain } from "@/hooks/useCronosBrain";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { resolveDisplayName } from "@/lib/displayName";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, MessageSquare } from "lucide-react";

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
        .select("id, query_text, selected_profile, created_at")
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
  const history = useInsightHistory(user?.id);

  function handleAsk(message: string) {
    if (!message.trim() || brain.isPending) return;
    setLastQuestion(message);
    
    brain.mutate(
      { message, profile },
      {
        onSuccess: () => {
          if (user) {
            queryClient.invalidateQueries({ queryKey: ["insight_history", user?.id] });
          }
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

  // --- COMPONENTE DE CONTEÚDO PRINCIPAL (Vitrine + Dashboard) ---
  const MainContent = () => (
    <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-10">
      {/* 1. Insight do Dia (DailyBriefing) */}
      <DailyBriefing />
      
      {/* 2. Painel de Mercado e Ativos */}
      <MarketDashboard />
      
      {/* 3. Lógica de Histórico (Só aparece se logado e com itens) */}
      {user && history.data && history.data.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-widest opacity-70">Últimos Insights</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {history.data.map((item: any) => (
              <Card 
                key={item.id} 
                className="p-4 border-border/40 bg-card/40 cursor-pointer hover:bg-card/60 transition-colors"
                onClick={() => handleAsk(item.query_text)}
              >
                <div className="space-y-2">
                   <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-tighter">
                      {item.selected_profile}
                   </Badge>
                   <p className="line-clamp-2 text-sm font-medium italic">"{item.query_text}"</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. Escolha de Perfil e Consultoria */}
      <hr className="border-border/5" />
      <ProfileLens profile={profile} onChange={setProfile} />
      <ConsultoriaInteligente
        profile={profile}
        isLoading={brain.isPending}
        onSubmit={handleAsk}
      />

      {/* 5. Exibição da Resposta da IA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={lastQuestion ?? "idle"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ResponseDisplay
            isLoading={brain.isPending}
            error={brain.error as Error | null}
            answer={brain.data?.answer ?? null}
            question={lastQuestion}
          />
        </motion.div>
      </AnimatePresence>

      <MonetizationBanner />
    </main>
  );

  // --- RENDERIZAÇÃO FINAL ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Passamos uma flag para o Header mostrar o botão de login na vitrine */}
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
