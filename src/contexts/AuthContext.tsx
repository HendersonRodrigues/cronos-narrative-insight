import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { ProfileDataRow } from "@/types/database";

export type AppRole = "admin" | "moderator" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  profileData: ProfileDataRow | null;
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
  const [profileData, setProfileData] = useState<ProfileDataRow | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Busca dados cadastrais (full_name, avatar_url, etc.) da tabela `profiles`.
   * Resiliente: se a tabela não existir ou houver erro de RLS, mantém null
   * sem quebrar o fluxo de autenticação.
   */
// No AuthContext.tsx, altere para isto:

const fetchProfileData = async (userId: string) => {
    if (!supabase) return;
    try {
      // IMPORTANTE: a coluna `role` foi removida de `profiles` na migração para
      // o sistema dedicado `user_roles`. Não incluir aqui — selecionar uma
      // coluna inexistente faz o select inteiro falhar.
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, updated_at, risk_profile")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // Mapeamos para ProfileDataRow. 
      // Como 'email' e 'created_at' estão na interface mas não no select, eles serão null, o que não quebra o código.
      setProfileData((data as unknown as ProfileDataRow) ?? null);
    } catch (err) {
      console.warn(
        "[Auth] Erro ao carregar perfil:",
        (err as Error)?.message,
      );
      setProfileData(null);
    }
  };

  /**
   * Resolve o role do usuário usando a função RPC `has_role` (SECURITY DEFINER).
   *
   * Por que RPC em vez de SELECT direto?
   * - Evita recursão de RLS quando políticas de outras tabelas chamam has_role.
   * - Não depende de policies de leitura em `user_roles` para o próprio usuário.
   * - Resiliente: qualquer erro/ausência da função => fallback "user".
   *
   * Defere a chamada com setTimeout para evitar deadlock dentro do
   * callback síncrono de `onAuthStateChange`.
   */
  const fetchUserRole = async (userId: string) => {
    if (!supabase) return;
    try {
      const checkRole = async (role: AppRole) => {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: role,
        });
        if (error) throw error;
        return Boolean(data);
      };

      // Checa admin/moderator em paralelo. Fallback: consulta direta a
      // user_roles caso o RPC has_role não exista no projeto.
      const [isAdminRpc, isModRpc] = await Promise.all([
        checkRole("admin"),
        checkRole("moderator"),
      ]);

      console.info("[Auth] role check via RPC", { userId, isAdminRpc, isModRpc });

      if (isAdminRpc) setUserRole("admin");
      else if (isModRpc) setUserRole("moderator");
      else setUserRole("user");
    } catch (err) {
      console.warn(
        "[Auth] has_role indisponível, tentando fallback user_roles:",
        (err as Error)?.message,
      );
      // Fallback: lê diretamente da tabela user_roles
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (error) throw error;
        const roles = (data ?? []).map((r) => r.role as AppRole);
        console.info("[Auth] roles via tabela user_roles", roles);
        if (roles.includes("admin")) setUserRole("admin");
        else if (roles.includes("moderator")) setUserRole("moderator");
        else setUserRole("user");
      } catch (e) {
        console.warn("[Auth] fallback user_roles falhou:", (e as Error)?.message);
        setUserRole("user");
      }
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
        setTimeout(() => {
          fetchUserRole(nextSession.user.id);
          fetchProfileData(nextSession.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    // 2) Em seguida, lê a sessão atual.
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial ?? null);
      setUser(initial?.user ?? null);
      if (initial?.user) {
        setTimeout(() => {
          fetchUserRole(initial.user.id);
          fetchProfileData(initial.user.id);
        }, 0);
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
        profileData,
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
