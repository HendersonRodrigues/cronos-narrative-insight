import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "moderator" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca o role mais alto da tabela user_roles (segura, separada de profiles).
  // Defere a chamada para evitar deadlock dentro do listener do Supabase.
  const fetchUserRole = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        // Tabela ainda não criada ou sem permissão — usuário comum por padrão.
        console.warn("[Auth] user_roles indisponível:", error.message);
        setUserRole("user");
        return;
      }

      const roles = (data ?? []).map((r) => r.role as AppRole);
      if (roles.includes("admin")) setUserRole("admin");
      else if (roles.includes("moderator")) setUserRole("moderator");
      else setUserRole("user");
    } catch (err) {
      console.error("[Auth] Erro ao buscar role:", err);
      setUserRole("user");
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1) Listener PRIMEIRO (boa prática Supabase para evitar perda de eventos).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // Defer para evitar deadlock dentro do callback síncrono.
        setTimeout(() => fetchUserRole(nextSession.user.id), 0);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    // 2) Em seguida, lê a sessão atual.
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial ?? null);
      setUser(initial?.user ?? null);
      if (initial?.user) {
        setTimeout(() => fetchUserRole(initial.user.id), 0);
      }
      setLoading(false);
    });

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = userRole === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isAdmin,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
