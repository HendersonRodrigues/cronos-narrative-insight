-- =============================================================================
-- Etapa 3 — Governança de publicação (Smart-Paste)
-- =============================================================================
-- Este projeto usa Supabase EXTERNO (VITE_SUPABASE_URL/ANON_KEY), portanto
-- migrations não são aplicadas automaticamente. Copie e cole este script
-- no SQL Editor do Supabase para sincronizar o schema.
--
-- Idempotente: pode ser executado várias vezes sem efeito colateral.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- daily_briefing — status + sentimento + setup operacional
-- ---------------------------------------------------------------------------
alter table public.daily_briefing
  add column if not exists status text not null default 'draft',
  add column if not exists market_sentiment text,
  add column if not exists trade_setup text,
  add column if not exists details_content text,
  add column if not exists deep_analysis text,
  add column if not exists assets_linked text[] default '{}'::text[],
  add column if not exists author_id uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'daily_briefing_status_check'
  ) then
    alter table public.daily_briefing
      add constraint daily_briefing_status_check
      check (status in ('draft','published','archived'));
  end if;
end $$;

drop index if exists public.daily_briefing_date_key;
create index if not exists idx_daily_briefing_date
  on public.daily_briefing (date desc);
create index if not exists idx_daily_briefing_status
  on public.daily_briefing (status, date desc);

-- ---------------------------------------------------------------------------
-- app_questions — status (mantém is_active para retrocompat)
-- ---------------------------------------------------------------------------
alter table public.app_questions
  add column if not exists status text not null default 'draft';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_questions_status_check'
  ) then
    alter table public.app_questions
      add constraint app_questions_status_check
      check (status in ('draft','published','archived'));
  end if;
end $$;

create index if not exists idx_app_questions_status
  on public.app_questions (status);

-- ---------------------------------------------------------------------------
-- investment_opportunities — status + arquivamento + campos de insight
-- ---------------------------------------------------------------------------
alter table public.investment_opportunities
  add column if not exists status text not null default 'draft',
  add column if not exists is_archived boolean not null default false,
  add column if not exists summary text,
  add column if not exists details_content text,
  add column if not exists deep_analysis text,
  add column if not exists assets_linked text[] default '{}'::text[],
  add column if not exists author_id uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'investment_opportunities_status_check'
  ) then
    alter table public.investment_opportunities
      add constraint investment_opportunities_status_check
      check (status in ('draft','published','archived'));
  end if;
end $$;

create index if not exists idx_opportunities_status_archived
  on public.investment_opportunities (status, is_archived);

-- ---------------------------------------------------------------------------
-- RLS — leitura pública só do que está publicado e não arquivado
-- ---------------------------------------------------------------------------
alter table public.daily_briefing enable row level security;

drop policy if exists "Public read published briefings" on public.daily_briefing;
create policy "Public read published briefings"
  on public.daily_briefing for select to public
  using (status = 'published');

drop policy if exists "Admins manage briefings" on public.daily_briefing;
create policy "Admins manage briefings"
  on public.daily_briefing for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Public read active questions" on public.app_questions;
create policy "Public read published questions"
  on public.app_questions for select to public
  using (is_active = true and status = 'published');

drop policy if exists "Public read active opportunities" on public.investment_opportunities;
create policy "Public read published opportunities"
  on public.investment_opportunities for select to public
  using (is_active = true and is_archived = false and status = 'published');
