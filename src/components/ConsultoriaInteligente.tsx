import { useEffect, useState, type FormEvent } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import type { ProfileType } from "@/types/cronos";
import { listQuestions } from "@/services/adminService";

const FALLBACK_SUGGESTIONS = [
  "Qual o impacto da Selic no IBOV?",
  "O Dólar está esticado tecnicamente?",
  "Como o IPCA afeta a renda fixa hoje?",
  "Cenário macro para os próximos 30 dias?",
];

interface Props {
  profile: ProfileType;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export default function ConsultoriaInteligente({ profile, isLoading, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingQs, setLoadingQs] = useState(true);
  const [errored, setErrored] = useState(false);

  // Função para embaralhar e selecionar 4 perguntas
  const getRandomQuestions = (questions: string[], count = 4) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

 useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingQs(true);
        const rows = await listQuestions({ onlyActive: true });
        
        if (!mounted) return;

        // Definimos a fonte de dados (Banco ou Fallback)
        const dataSource = (rows && rows.length > 0) 
          ? rows.map((r) => r.text) 
          : FALLBACK_SUGGESTIONS;

        // AQUI ESTÁ A CORREÇÃO: Aplicamos o sorteio e limitamos a 4
        const selected = getRandomQuestions(dataSource, 4);
        setSuggestions(selected);

      } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
        if (!mounted) return;
        setErrored(true);
        // Aplica o sorteio também no erro para manter o padrão de 4
        setSuggestions(getRandomQuestions(FALLBACK_SUGGESTIONS, 4));
      } finally {
        if (mounted) setLoadingQs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue(""); // Limpa o campo após enviar
  }

  function handleSuggestion(text: string) {
    if (isLoading) return;
    setValue(text);
    onSubmit(text);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Consultoria Inteligente
        </h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          perfil · <span className="text-primary">{profile}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pergunte ao Cronos sobre o mercado…"
          disabled={isLoading}
          className="h-14 pr-14 pl-5 text-base bg-card/60 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {loadingQs ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          title="Sem perguntas sugeridas"
          description={
            errored
              ? "Não conseguimos carregar as sugestões agora. Você ainda pode digitar sua pergunta acima."
              : "Nenhuma pergunta inteligente disponível no momento."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {suggestions.map((s, idx) => (
            <button
              key={`${s}-${idx}`} // Chave composta para evitar problemas com textos duplicados
              type="button"
              onClick={() => handleSuggestion(s)}
              disabled={isLoading}
              className="group rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-left text-sm text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary/70 group-hover:text-primary">
                ↗ sugestão
              </span>
              <p className="mt-1 leading-snug">{s}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
