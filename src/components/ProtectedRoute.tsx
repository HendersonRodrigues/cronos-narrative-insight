import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // Novo parâmetro opcional
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verifica se o usuário está logado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se a rota for apenas para admin e o usuário não for admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/oportunidades" replace />;
  }

  return <>{children}</>;
}
