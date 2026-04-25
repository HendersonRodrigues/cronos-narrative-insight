-- =============================================================================
-- Schema de referência: app_questions + investment_opportunities
-- =============================================================================
-- Estas tabelas JÁ FORAM CRIADAS manualmente no Supabase via SQL Editor.
-- Este arquivo serve como REGISTRO/SINCRONIA do schema no repositório
-- (não é uma migration executável automaticamente — a pasta
-- `supabase/migrations/` é controlada pelo Lovable Cloud, e este projeto
-- usa Supabase externo via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
--
-- Para reaplicar em um ambiente novo, copie e cole no SQL Editor.
-- O script é IDEMPOTENTE (CREATE IF NOT EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) app_questions  — perguntas dinâmicas exibidas no app
-- -----------------------------------------------------------------------------
create table if not exists public.app_questions (
  id           uuid primary key default gen_random_uuid(),
  text         text not null,
  is_active    boolean not null default true,
  category     text,
  order_index  integer default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index if not exists idx_app_questions_active
  on public.app_questions (is_active, order_index);

alter table public.app_questions enable row level security;

-- Leitura pública apenas das perguntas ativas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'app_questions'
      and policyname = 'Public read active questions'
  ) then
    create policy "Public read active questions"
      on public.app_questions for select to public
      using (is_active = true);
  end if;
end $$;

-- Escrita restrita a admins (via has_role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'app_questions'
      and policyname = 'Admins manage questions'
  ) then
    create policy "Admins manage questions"
      on public.app_questions for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2) investment_opportunities — oportunidades de diversificação estratégica
-- -----------------------------------------------------------------------------
create table if not exists public.investment_opportunities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  return_rate     numeric(6,4),     -- 0.1800 = 18%
  risk_level      text not null default 'medio',
  is_active       boolean not null default true,
  category        text,
  min_investment  numeric(14,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create index if not exists idx_opportunities_active
  on public.investment_opportunities (is_active);

alter table public.investment_opportunities enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'investment_opportunities'
      and policyname = 'Public read active opportunities'
  ) then
    create policy "Public read active opportunities"
      on public.investment_opportunities for select to public
      using (is_active = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'investment_opportunities'
      and policyname = 'Admins manage opportunities'
  ) then
    create policy "Admins manage opportunities"
      on public.investment_opportunities for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
