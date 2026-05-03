import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

interface CronosHeaderProps {
  showLoginButton?: boolean;
}

export default function CronosHeader({ showLoginButton = true }: CronosHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/60">
      <header className="container max-w-[1200px] w-full flex justify-between items-center px-4 md:px-6 py-3.5 text-foreground">

        {/* LADO ESQUERDO: BRANDING (Compacto) */}
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 bg-background border border-primary/30 rounded-md">
            <Activity className="w-4 h-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[0.12em] leading-none uppercase font-display">
              CRONOS
            </span>
            <span className="text-[8px] text-muted-foreground tracking-[0.2em] font-medium mt-1 uppercase">
              Inteligência de Mercado
            </span>
          </div>
        </div>

        {/* LADO DIREITO: STATUS + CTAs */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* INDICADOR LIVE (Oculto em telas muito pequenas) */}
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-border/60">
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-primary/80 uppercase font-mono">
              LIVE • CRONOS BRAIN
            </span>
          </div>

          <ThemeToggle />

          {/* BOTÕES DE LOGIN / CONTA */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <button
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  onClick={() => navigate('/auth?redirect=/')}
                >
                  Entrar
                </button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-4 h-8 rounded-sm transition-all active:scale-95"
                  onClick={() => navigate('/auth?mode=signup&redirect=/')}
                >
                  Criar Conta
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/profile')}
                  title="Perfil"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
