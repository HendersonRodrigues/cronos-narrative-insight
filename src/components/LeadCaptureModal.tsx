import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityTitle: string;
}

function maskWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function LeadCaptureModal({
  open,
  onOpenChange,
  opportunityTitle,
}: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset after closing animation
      const t = setTimeout(() => {
        setName("");
        setWhatsapp("");
        setSuccess(false);
        setSubmitting(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  console.log("🚀 BOTÃO CLICADO! Iniciando handleSubmit...");

  const trimmedName = name.trim();
  const digits = whatsapp.replace(/\D/g, "");

  console.log("Dados capturados:", { name: trimmedName, phone: digits, opportunity: opportunityTitle });

  if (trimmedName.length < 3) {
    console.warn("❌ Falha na validação do nome");
    toast.error("Informe seu nome completo.");
    return;
  }
  
  if (digits.length < 10) {
    console.warn("❌ Falha na validação do WhatsApp");
    toast.error("WhatsApp inválido.");
    return;
  }

  setSubmitting(true);
  console.log("📡 Tentando conexão com Supabase...");

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { 
          full_name: trimmedName, 
          whatsapp: digits, 
          opportunity_name: opportunityTitle,
          status: 'novo' 
        }
      ]);

    if (error) {
      console.error("🔥 ERRO DO SUPABASE:", error);
      throw error;
    }

    console.log("✅ SUCESSO! Lead gravado:", data);
    setSuccess(true);
    toast.success("Interesse registrado!");
  } catch (error) {
    console.error("🕵️ ERRO CAPTURADO NO CATCH:", error);
  } finally {
    setSubmitting(false);
  }
}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/60 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Interesse Estratégico
            </span>
          </div>
          <DialogTitle className="font-display text-xl tracking-tight">
            {opportunityTitle}
          </DialogTitle>
          <DialogDescription className="text-foreground/70">
            Deixe seu contato e um especialista falará com você sobre essa oportunidade.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-risk-on" />
            <h3 className="font-display text-lg">Solicitação registrada</h3>
            <p className="text-sm text-foreground/70 max-w-xs">
              Recebemos seu interesse em{" "}
              <span className="text-foreground">{opportunityTitle}</span>. Em breve um
              especialista entrará em contato pelo WhatsApp.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="opportunity" value={opportunityTitle} />

            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Nome completo</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como devemos te chamar?"
                autoComplete="name"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-whatsapp">WhatsApp</Label>
              <Input
                id="lead-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero falar com um especialista"
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Ao enviar, você concorda em ser contatado. Esta plataforma não constitui
              recomendação de investimento.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
