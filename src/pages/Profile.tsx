import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type RiskProfile = "conservador" | "moderado" | "arrojado";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("moderado");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const email = useMemo(() => user?.email ?? "", [user?.email]);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!supabase || !user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, risk_profile")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        toast.error("Falha ao carregar perfil");
        setLoading(false);
        return;
      }

      setFullName(data?.full_name ?? "");
      const nextRisk = (data?.risk_profile ?? "moderado").toLowerCase() as RiskProfile;
      if (["conservador", "moderado", "arrojado"].includes(nextRisk)) {
        setRiskProfile(nextRisk);
      }
      setLoading(false);
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        risk_profile: riskProfile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar seu perfil.");
      return;
    }
    toast.success("Perfil atualizado com sucesso.");
  }

  return (
    <section className="container max-w-3xl mx-auto px-4 py-8">
      <Card className="p-6 md:p-8 border-border/60 bg-card/70">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atualize seus dados pessoais e seu perfil de risco.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground mt-6">Carregando dados...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de Risco</Label>
              <Select value={riskProfile} onValueChange={(v) => setRiskProfile(v as RiskProfile)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservador">Conservador</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="arrojado">Arrojado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
