-- =====================================================================
-- ETAPA 3 — Saúde de Integrações (integration_logs)
-- =====================================================================
-- Cria a tabela `integration_logs` para monitorar a saúde das APIs
-- consumidas pelo Cronos (Câmbio, SELIC, Cripto, etc).
--
-- COMO USAR:
--   1. Abra o SQL Editor do Supabase (Lovable Cloud).
--   2. Cole TODO este arquivo.
--   3. Execute.
--
-- Idempotente: pode ser rodado múltiplas vezes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------
create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  status_code integer,
  status text not null default 'ok' check (status in ('ok', 'warning', 'error')),
  error_message text,
  context jsonb,
  last_check timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists integration_logs_service_idx
  on public.integration_logs (service_name, last_check desc);

create index if not exists integration_logs_status_idx
  on public.integration_logs (status, last_check desc);

-- ---------------------------------------------------------------------
-- RLS — apenas admins leem; qualquer sessão autenticada pode inserir
-- (frontend reporta falhas; admins consomem o feed).
-- ---------------------------------------------------------------------
alter table public.integration_logs enable row level security;

drop policy if exists "Admins read integration_logs" on public.integration_logs;
create policy "Admins read integration_logs"
  on public.integration_logs
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Authenticated insert integration_logs" on public.integration_logs;
create policy "Authenticated insert integration_logs"
  on public.integration_logs
  for insert
  to authenticated
  with check (true);

-- Permite registro de falhas mesmo em sessões anônimas (ex.: erro antes do login)
drop policy if exists "Anon insert integration_logs" on public.integration_logs;
create policy "Anon insert integration_logs"
  on public.integration_logs
  for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------------
-- View: último status por serviço
-- ---------------------------------------------------------------------
create or replace view public.integration_health_latest as
select distinct on (service_name)
  service_name,
  status,
  status_code,
  error_message,
  context,
  last_check
from public.integration_logs
order by service_name, last_check desc;

grant select on public.integration_health_latest to authenticated;

-- =====================================================================
-- FIM
-- =====================================================================
