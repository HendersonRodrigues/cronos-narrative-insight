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
    <header className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-white/5 bg-[#020817] text-white sticky top-0 z-50 w-full">
      {/* LADO ESQUERDO: IDENTIDADE VISUAL RESTAURADA (Imagem 1) */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative p-2 bg-[#020817] border border-cyan-500/30 rounded-lg">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-[0.15em] leading-none uppercase font-display">
            CRONOS
          </span>
          <span className="text-[9px] text-gray-500 tracking-[0.25em] font-medium mt-1 uppercase">
            Inteligência de Mercado
          </span>
        </div>
      </div>

      {/* LADO DIREITO: LIVE STATUS + CTAs (Mescla Imagem 1 e 2) */}
      <div className="flex items-center gap-4 md:gap-8">
        {/* INDICADOR LIVE (Visível em Desktop) */}
        <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-white/5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          <span className="text-[10px] font-semibold tracking-[0.2em] text-cyan-500/80 uppercase font-mono">
            LIVE • CRONOS BRAIN
          </span>
        </div>

        {/* CTAs DE AUTH */}
        <div className="flex items-center gap-3 md:gap-5">
          {!user ? (
            <>
              <button 
                className="text-xs font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                onClick={() => navigate('/auth')}
              >
                Entrar
              </button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-400 text-[#020817] font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] px-4 md:px-6 h-9 rounded-md transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                onClick={() => navigate('/auth')}
              >
                Criar Conta
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={() => navigate('/profile')}
              >
                <User className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-red-400"
                onClick={() => signOut()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
