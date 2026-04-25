/**
 * Tipos TypeScript sincronizados manualmente com o schema do banco.
 *
 * Cobre as tabelas/funções introduzidas em
 * `docs/database/setup-user-roles.sql`:
 *   - enum public.app_role
 *   - tabela public.user_roles
 *   - função public.has_role(_user_id uuid, _role app_role) returns boolean
 *
 * Use estes tipos como genéricos ao chamar `supabase.from(...)` /
 * `supabase.rpc(...)` para obter autocomplete e segurança de tipos.
 */

export type AppRole = "admin" | "moderator" | "user";

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface HasRoleArgs {
  _user_id: string;
  _role: AppRole;
}

/**
 * Assinaturas das RPCs disponíveis no schema `public`.
 * Mantenha em sincronia com as funções `security definer` do banco.
 */
export interface DatabaseRpc {
  has_role: {
    Args: HasRoleArgs;
    Returns: boolean;
  };
}
