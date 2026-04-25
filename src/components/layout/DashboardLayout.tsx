import { memo } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { resolveDisplayName } from "@/lib/displayName";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? "text-foreground font-medium"
    : "text-muted-foreground hover:text-foreground transition-colors";
}

/**
 * DashboardLayout — shell autenticada.
 *
 * Otimizações:
 *  - Reusa `profileData` do AuthContext (sem novo fetch à tabela profiles).
 *  - Resolve o nome via `resolveDisplayName` (mesma regra do Index).
 *  - Memoizado para evitar re-render quando children não mudam.
 */
function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAdmin, profileData, signOut } = useAuth();
  const displayName = resolveDisplayName(profileData?.full_name, user?.email, "Usuário");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
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
                    <Shield className="h-3.5 w-3.5" aria-hidden />
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
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default memo(DashboardLayout);
