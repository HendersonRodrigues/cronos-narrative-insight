import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CronosHeader = ({ showLoginButton = true }: { showLoginButton?: boolean }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-[1200px] items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-primary">CRONOS</span>
        </div>

        <div className="flex items-center gap-4">
          {!user && showLoginButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="font-medium text-muted-foreground hover:text-primary"
            >
              Entrar
            </Button>
          )}
          {!user && (
            <Button 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground font-semibold"
            >
              Criar Conta
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CronosHeader;
