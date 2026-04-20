import { useState } from "react";
import CronosHeader from "@/components/CronosHeader";
import DailyBriefing from "@/components/DailyBriefing";
import ProfileLens from "@/components/ProfileLens";
import ConsultoriaInteligente from "@/components/ConsultoriaInteligente";
import ResponseDisplay from "@/components/ResponseDisplay";
import MonetizationBanner from "@/components/MonetizationBanner";
import FooterFeed from "@/components/FooterFeed";
import { useProfile } from "@/hooks/useProfile";
import { useCronosBrain } from "@/hooks/useCronosBrain";
import { logQuery } from "@/services/analyticsService";

const Index = () => {
  const { profile, setProfile, sessionId } = useProfile();
  const brain = useCronosBrain();
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  function handleAsk(message: string) {
    setLastQuestion(message);
    logQuery({ session_id: sessionId, profile, message });
    brain.mutate({ message, profile });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CronosHeader />

      <main className="container max-w-5xl mx-auto flex-1 px-4 py-8 space-y-10">
        <DailyBriefing />

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
};

export default Index;
