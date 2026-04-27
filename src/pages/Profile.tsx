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
import { Camera, Loader2, Lock } from "lucide-react";

type RiskProfile = "conservador" | "moderado" | "arrojado";

const INTEREST_CATEGORIES = {
  "Tipo de Investimento": ["Renda Fixa", "Renda Variável", "Fundos", "Previdência"],
  "Ativos": ["CDB", "SELIC", "Ações", "FIIs", "Dólar", "Ouro", "Bitcoin"],
  "Objetivos": ["Crescimento", "Manutenção", "Renda Mensal", "Reserva de Emergência"]
};

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("moderado");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para Senha
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
        .select("full_name, risk_profile, interests, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        toast.error("Falha ao carregar perfil");
        setLoading(false);
        return;
      }

      setFullName(data?.full_name ?? "");
      setInterests(data?.interests ?? []);
      setAvatarUrl(data?.avatar_url ?? null);
      
      const nextRisk = (data?.risk_profile ?? "moderado").toLowerCase() as RiskProfile;
      if (["conservador", "moderado", "arrojado"].includes(nextRisk)) {
        setRiskProfile(nextRisk);
      }
      setLoading(false);
    }

    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    try {
      setSaving(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast.success("Foto carregada! Salve o perfil para confirmar.");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    
    if (error) toast.error(error.message);
    else {
      toast.success("Senha atualizada! Verifique seu e-mail.");
      setNewPassword("");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        risk_profile: riskProfile,
        interests: interests,
        avatar_url: avatarUrl,
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
    <section className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Coluna da Esquerda: Dados e Interesses */}
        <div className="flex-1 space-y-6">
          <Card className="p-6 md:p-8 border-border/60 bg-card/70">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-muted flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{fullName[0] || "?"}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:scale-105 transition-transform">
                  <Camera size={14} />
                  <input type="file" className="hidden" onChange={handleUploadAvatar} accept="image/*" />
                </label>
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Perfil de Risco</Label>
                  <Select value={riskProfile} onValueChange={(v) => setRiskProfile(v as RiskProfile)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservador">Conservador</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="arrojado">Arrojado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/40">
                  <Label className="text-base">Interesses Estratégicos</Label>
                  {Object.entries(INTEREST_CATEGORIES).map(([category, options]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{category}</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map(opt => (
                          <Button
                            key={opt}
                            type="button"
                            variant={interests.includes(opt) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleInterest(opt)}
                            className="rounded-full text-xs h-8"
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Salvar todas as alterações"}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Coluna da Direita: Segurança */}
        <div className="w-full md:w-80">
          <Card className="p-6 border-border/60 bg-card/70">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Lock size={18} className="text-primary" /> Segurança
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button 
                variant="secondary" 
                className="w-full" 
                disabled={changingPassword || !newPassword}
                onClick={handlePasswordChange}
              >
                {changingPassword ? "Atualizando..." : "Trocar Senha"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Você receberá um e-mail para confirmar a nova senha.
              </p>
            </div>
          </Card>
        </div>

      </div>
    </section>
  );
}
