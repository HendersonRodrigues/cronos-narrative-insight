-- RLS reconciliado com pg_policies do Supabase (2026-04-24).

alter table public.market_data enable row level security;
alter table public.daily_briefing enable row level security;
alter table public.user_analytics enable row level security;
alter table public.leads enable row level security;
alter table public.profiles enable row level security;

-- MARKET DATA
drop policy if exists "Permitir leitura pública de market_data" on public.market_data;
create policy "Permitir leitura pública de market_data"
  on public.market_data
  for select
  to public
  using (true);

-- DAILY BRIEFING
drop policy if exists "Allow public read" on public.daily_briefing;
create policy "Allow public read"
  on public.daily_briefing
  for select
  to public
  using (true);

-- USER ANALYTICS
drop policy if exists "Allow anon insert" on public.user_analytics;
create policy "Allow anon insert"
  on public.user_analytics
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anonymous insert" on public.user_analytics;
create policy "Allow anonymous insert"
  on public.user_analytics
  for insert
  to public
  with check (true);

-- LEADS
drop policy if exists "Permitir inserção pública de leads" on public.leads;
create policy "Permitir inserção pública de leads"
  on public.leads
  for insert
  to public
  with check (true);

drop policy if exists "Usuários podem deletar seus próprios leads" on public.leads;
create policy "Usuários podem deletar seus próprios leads"
  on public.leads
  for delete
  to public
  using (auth.uid() = user_id);

drop policy if exists "Usuários podem inserir seus próprios leads" on public.leads;
create policy "Usuários podem inserir seus próprios leads"
  on public.leads
  for insert
  to public
  with check (auth.uid() = user_id);

drop policy if exists "Usuários podem ver apenas seus próprios leads" on public.leads;
create policy "Usuários podem ver apenas seus próprios leads"
  on public.leads
  for select
  to public
  using (auth.uid() = user_id);

-- PROFILES
drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles
  for update
  to public
  using (auth.uid() = id);

drop policy if exists "Usuários podem ver seu próprio perfil" on public.profiles;
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles
  for select
  to public
  using (auth.uid() = id);
