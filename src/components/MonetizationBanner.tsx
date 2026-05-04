import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function MonetizationBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Espelha exatamente o filtro usado em /oportunidades:
  // só mostra o card no Index se houver oportunidades ativas publicadas.
  const { data: count } = useQuery({
    queryKey: ["opportunities_active_count"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!supabase) return 0;
      const { count, error } = await supabase
        .from("investment_opportunities")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth?redirect=/oportunidades");
    }
  };

  if (!count || count === 0) return null;

  return (
    <Link
      to="/oportunidades"
      onClick={handleClick}
      className="group relative block overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 transition-all hover:border-primary/60 hover:glow-primary"
    >
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Oportunidade Estratégica
            </span>
          </div>
          <h4 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Investimentos Descorrelacionados
          </h4>
          <p className="text-sm text-foreground/70 max-w-xl">
            Diversifique sua carteira com ativos que se movem fora do ciclo tradicional do
            IBOV e da Selic. Curadoria proprietária, alinhada ao seu perfil.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary group-hover:text-glow-primary">
            Explorar
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
