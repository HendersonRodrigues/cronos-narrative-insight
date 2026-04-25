-- =====================================================================
-- COPIE E EXECUTE ESTE SQL NO DASHBOARD DO SUPABASE (SQL Editor)
-- Cria sistema de roles SEGURO (evita privilege escalation)
-- =====================================================================

-- 1) Enum de roles
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end$$;

-- 2) Tabela dedicada user_roles (NUNCA armazene role em profiles)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user on public.user_roles (user_id);

alter table public.user_roles enable row level security;

-- 3) Função SECURITY DEFINER (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 4) Políticas RLS para user_roles
drop policy if exists "Usuário pode ver seus próprios roles" on public.user_roles;
create policy "Usuário pode ver seus próprios roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins podem ver todos os roles" on public.user_roles;
create policy "Admins podem ver todos os roles"
  on public.user_roles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins podem gerenciar roles" on public.user_roles;
create policy "Admins podem gerenciar roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 5) Permitir admins lerem todos os profiles, leads e analytics (painel)
drop policy if exists "Admins podem ver todos os profiles" on public.profiles;
create policy "Admins podem ver todos os profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins podem ver todos os leads" on public.leads;
create policy "Admins podem ver todos os leads"
  on public.leads
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins podem ver analytics" on public.user_analytics;
create policy "Admins podem ver analytics"
  on public.user_analytics
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 6) Para promover um usuário a admin, execute (substitua o email):
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role from auth.users where email = 'seu@email.com'
-- on conflict (user_id, role) do nothing;
