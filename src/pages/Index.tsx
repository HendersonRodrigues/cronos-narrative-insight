import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface InsightHistoryRow {
  id: string;
  query_text: string;
  selected_profile: string;
  created_at: string;
}

/**
 * Histórico de insights do usuário com stale-while-revalidate.
 * Em vez de useEffect + setTimeout, deixamos o React Query cuidar
 * de cache, refetch em foco e invalidação após cada nova consulta.
 */
function useInsightHistory(userId?: string) {
  return useQuery<InsightHistoryRow[]>({
    queryKey: ["insight_history", userId],
    enabled: Boolean(userId && supabase),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
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
      return (data ?? []) as InsightHistoryRow[];
    },
  });
}

const Index = () => {
  const { user, loading, profileData } = useAuth();
  const { profile, setProfile } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const history = useInsightHistory(user?.id);

  function handleAsk(message: string) {
    if (!message.trim() || brain.isPending) return;
    setLastQuestion(message);
    brain.mutate(
      { message, profile },
      {
        onSuccess: () => {
          // Pequeno atraso para a Edge Function persistir antes de refetch
          setTimeout(() => history.refetch(), 1500);
        },
      },
    );
  }

  // Skeleton minimalista enquanto a sessão é resolvida (LCP-friendly)
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

  // Landing pública (visitante não autenticado)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader />
        <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-10">
          <DailyBriefing />
          <MarketDashboard />
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
          <MonetizationBanner />
        </main>
        <FooterFeed />
      </div>
    );
  }

  const welcomeName = resolveDisplayName(profileData?.full_name, user?.email);
  const items = history.data ?? [];
  const isHistoryLoading = history.isLoading;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
        <main className="container max-w-[1200px] mx-auto flex-1 px-4 py-8 space-y-8">
          {/* LCP — saudação renderiza imediatamente */}
          <section className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight italic">
              Boas-vindas, {welcomeName}
            </h1>
            <p className="text-muted-foreground">
              Analise o mercado com precisão estratégica.
            </p>
          </section>

          {/* Histórico — Skeleton → EmptyState → Cards animados */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="h-4 w-4" aria-hidden />
              <h2 className="text-sm font-medium uppercase tracking-wider">
                Últimos Insights
              </h2>
            </div>

            {isHistoryLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Card
                    key={i}
                    className="border-border/40 bg-card/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-9/12" />
                  </Card>
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5" />}
                title="Sem consultas ainda"
                description="Seu histórico aparecerá aqui após sua primeira consulta ao Cronos."
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <Card
                        className="group h-full cursor-pointer border-border/40 bg-card/40 p-4 transition-all hover:bg-card/80"
                        onClick={() => handleAsk(item.query_text)}
                      >
                        <div className="flex h-full flex-col justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase"
                              >
                                {item.selected_profile}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                              "{item.query_text}"
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
                            Ver análise <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>

          <hr className="border-border/10" />
          <ProfileLens profile={profile} onChange={setProfile} />
          <ConsultoriaInteligente
            profile={profile}
            isLoading={brain.isPending}
            onSubmit={handleAsk}
          />

          {/* Transição suave para o bloco de resposta da IA */}
          <AnimatePresence mode="wait">
            <motion.div
              key={lastQuestion ?? "idle"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <ResponseDisplay
                isLoading={brain.isPending}
                error={brain.error as Error | null}
                answer={brain.data?.answer ?? null}
                question={lastQuestion}
              />
            </motion.div>
          </AnimatePresence>
        </main>
        <FooterFeed />
      </div>
    </DashboardLayout>
  );
};

export default Index;
