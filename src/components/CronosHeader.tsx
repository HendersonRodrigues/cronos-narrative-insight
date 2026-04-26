import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react'; // Ou o ícone correspondente ao seu pulso

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-[#020817] text-white sticky top-0 z-50">
      {/* LADO ESQUERDO: BRANDING RESTAURADO */}
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
          <span className="text-lg font-bold tracking-[0.15em] leading-none uppercase">
            CRONOS
          </span>
          <span className="text-[10px] text-gray-400 tracking-[0.2em] font-medium mt-1 uppercase">
            Inteligência de Mercado
          </span>
        </div>
      </div>

      {/* LADO DIREITO: STATUS + NOVOS BOTÕES */}
      <div className="flex items-center gap-8">
        {/* INDICADOR LIVE (Do Layout Original) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          <span className="text-[10px] font-semibold tracking-widest text-cyan-500/80 uppercase">
            LIVE • CRONOS BRAIN
          </span>
        </div>

        {/* CTAs DE AUTH (Do Novo Layout) */}
        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
          {!user ? (
            <>
              <button 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                onClick={() => {/* logic */}}
              >
                Entrar
              </button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-[#020817] font-bold text-xs uppercase tracking-wider px-6 h-9 rounded-md transition-all active:scale-95"
                onClick={() => {/* logic */}}
              >
                Criar Conta
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              className="text-xs text-gray-400 hover:text-red-400" 
              onClick={signOut}
            >
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
