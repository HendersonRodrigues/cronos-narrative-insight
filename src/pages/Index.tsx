import { useState } from "react";
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

const Index = () => {
  const { user } = useAuth();
  const { profile, setProfile, sessionId } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Impacto da Selic no Ibovespa",
    "Cenário do dólar para 30 dias",
    "IPCA e renda fixa hoje",
    "Setores defensivos no ciclo atual",
    "Como proteger carteira no curto prazo",
  ]);

  function handleAsk(message: string) {
    setLastQuestion(message);
    if (user && supabase) {
      supabase.from("user_analytics").insert({
        user_id: user.id,
        query_text: message,
        selected_profile: profile,
        event_type: "consultoria_query",
        session_id: sessionId,
        profile,
        payload: { source: "home_chat" },
      });
      setRecentSearches((prev) => [message, ...prev.filter((item) => item !== message)].slice(0, 5));
    } else {
      logQuery({ session_id: sessionId, profile, message });
    }
    brain.mutate({ message, profile });
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CronosHeader />

        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-10">
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

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-73px)] flex flex-col bg-background">
        <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-8">
          <section className="space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Boas-vindas ao seu painel
            </h1>
            <p className="text-muted-foreground">
              Consulte o Cronos e acompanhe suas últimas buscas para acelerar sua análise.
            </p>
          </section>

          <Card className="p-5 border-border/60 bg-card/70">
            <h2 className="font-display text-lg font-semibold">Buscas Recentes</h2>
            <ul className="mt-3 space-y-2">
              {recentSearches.map((search) => (
                <li
                  key={search}
                  className="text-sm text-foreground/85 rounded-md border border-border/50 px-3 py-2"
                >
                  {search}
                </li>
              ))}
            </ul>
          </Card>

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
