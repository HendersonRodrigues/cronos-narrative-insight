import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? "text-foreground font-medium"
    : "text-muted-foreground hover:text-foreground transition-colors";
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function loadProfileName() {
      if (!supabase || !user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      setFullName(data?.full_name ?? "");
    }
    loadProfileName();
    return () => {
      mounted = false;
    };
  }, [user]);

  const displayName = fullName || user?.email || "Usuário";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display text-lg font-semibold tracking-tight">
              Cronos
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink to="/" className={navClassName}>
                Início
              </NavLink>
              <NavLink to="/oportunidades" className={navClassName}>
                Oportunidades
              </NavLink>
              <NavLink to="/perfil" className={navClassName}>
                Meu Perfil
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navClassName}>
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </span>
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground max-w-[220px] truncate">
              {displayName}
            </span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
