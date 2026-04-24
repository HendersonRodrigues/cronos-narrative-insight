-- Schema reconciliado com consulta ao Supabase (2026-04-24).
-- Fonte: information_schema.columns + pg_indexes enviados pelo usuario.

create table if not exists public.market_data (
  id bigserial primary key,
  asset_id text,
  date date not null,
  value numeric not null,
  meta jsonb
);

create index if not exists idx_market_data_asset_date
  on public.market_data (asset_id, date desc);

create unique index if not exists market_data_asset_id_date_key
  on public.market_data (asset_id, date);

create table if not exists public.daily_briefing (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date,
  title text,
  content text,
  profile_type text
);

create unique index if not exists daily_briefing_date_key
  on public.daily_briefing (date);

create table if not exists public.user_analytics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,
  selected_profile text,
  query_text text,
  device_info jsonb,
  event_type text not null,
  session_id uuid,
  profile text,
  payload jsonb
);

create index if not exists idx_user_analytics_event_created
  on public.user_analytics (event_type, created_at desc);

create index if not exists idx_user_analytics_session
  on public.user_analytics (session_id);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  whatsapp text not null,
  opportunity_name text not null,
  user_profile text,
  status text,
  user_id uuid references auth.users (id)
);

create index if not exists idx_leads_user
  on public.leads (user_id);

create index if not exists idx_leads_created_at
  on public.leads (created_at desc);

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  avatar_url text,
  risk_profile text,
  updated_at timestamptz
);
