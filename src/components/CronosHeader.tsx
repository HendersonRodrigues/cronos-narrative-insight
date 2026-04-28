import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CronosHeaderProps {
  showLoginButton?: boolean;
}

export default function CronosHeader({ showLoginButton = true }: CronosHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center sticky top-0 z-50 bg-[#020817] border-b border-white/5">
      <header className="container max-w-[1200px] w-full flex justify-between items-center px-4 md:px-6 py-3.5 text-white">
        
        {/* LADO ESQUERDO: BRANDING (Compacto) */}
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 bg-[#020817] border border-cyan-500/30 rounded-md">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[0.12em] leading-none uppercase font-display">
              CRONOS
            </span>
            <span className="text-[8px] text-gray-500 tracking-[0.2em] font-medium mt-1 uppercase">
              Inteligência de Mercado
            </span>
          </div>
        </div>

        {/* LADO DIREITO: STATUS + CTAs */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* INDICADOR LIVE (Oculto em telas muito pequenas) */}
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-white/5">
            <span className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-cyan-500/70 uppercase font-mono">
              LIVE • CRONOS BRAIN
            </span>
          </div>

          {/* BOTÕES DE LOGIN / CONTA */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <button
                  className="text-[10px] font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                  onClick={() => navigate('/auth')}
                >
                  Entrar
                </button>
                <Button
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#020817] font-bold text-[10px] uppercase tracking-wider px-4 h-8 rounded-sm transition-all active:scale-95"
                  onClick={() => navigate('/auth')}
                >
                  Criar Conta
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  onClick={() => navigate('/profile')}
                  title="Perfil"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-400"
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
