# Database - Schema e RLS

Documento de referencia para estrutura de dados e regras de seguranca no Supabase/Postgres.

Status: **consolidado com validacao no Supabase em 2026-04-24**.

## 1) Escopo Atual

Tabelas identificadas no frontend:

- `market_data`
- `daily_briefing`
- `user_analytics`
- `leads`
- `profiles` (citada em documentacao existente)

## 2) Dicionario de Tabelas

Preenchimento reconciliado com `information_schema.columns`:

### `market_data`

- Objetivo: armazenar serie historica e recente dos ativos para dashboard/analise.
- Colunas principais: `id`, `asset_id`, `date`, `value`, `meta`.
- Chave primaria: `id`.
- Indices relevantes: `idx_market_data_asset_date`, `market_data_asset_id_date_key` (unique).
- Quem escreve: processos backend/ingestao (nao observado no frontend).
- Quem le: frontend autenticado/anon (depende de RLS).

### `daily_briefing`

- Objetivo: armazenar briefing diario mais recente para exibicao principal.
- Colunas principais: `id`, `created_at`, `date`, `title`, `content`, `profile_type`.
- Chave primaria: `id`.
- Indices relevantes: `daily_briefing_date_key` (unique em `date`), `daily_briefing_pkey`.
- Quem escreve: processo backend/cron (inferido por comentario no codigo).
- Quem le: frontend para renderizacao e realtime.

### `user_analytics`

- Objetivo: registrar eventos de uso (troca de perfil e envio de consulta).
- Colunas principais: `id`, `created_at`, `user_id`, `selected_profile`, `query_text`, `device_info`, `event_type`, `session_id`, `profile`, `payload`.
- Chave primaria: `id`.
- Indices relevantes: `user_analytics_pkey`.
- Quem escreve: frontend via inserts fire-and-forget.
- Quem le: times internos/analytics (nao observado no frontend).

### `leads`

- Objetivo: captar interesse comercial em oportunidades.
- Colunas principais: `id`, `created_at`, `full_name`, `whatsapp`, `opportunity_name`, `user_profile`, `status`, `user_id`.
- Chave primaria: `id`.
- Indices relevantes: `leads_pkey`.
- Quem escreve: frontend (usuario autenticado, e possivelmente anon conforme policy).
- Quem le: operacao/comercial/backoffice (nao observado no frontend).

### `profiles`

- Objetivo: perfil estendido do usuario autenticado.
- Colunas principais: `id`, `full_name`, `avatar_url`, `risk_profile`, `updated_at`.
- Chave primaria: `id`.
- Indices relevantes: `profiles_pkey`.
- Quem escreve: trigger/backend e usuario autenticado (depende de policy).
- Quem le: usuario autenticado (depende de policy).

## 3) Politicas de RLS (Row Level Security)

Policies confirmadas:

- `daily_briefing`
  - `Allow public read` (`SELECT`, `to public`, `using true`)
- `market_data`
  - `Permitir leitura pública de market_data` (`SELECT`, `to public`, `using true`)
- `user_analytics`
  - `Allow anon insert` (`INSERT`, `to anon`, `with check true`)
  - `Allow anonymous insert` (`INSERT`, `to public`, `with check true`)
- `leads`
  - `Permitir inserção pública de leads` (`INSERT`, `to public`, `with check true`)
  - `Usuários podem inserir seus próprios leads` (`INSERT`, `to public`, `with check auth.uid() = user_id`)
  - `Usuários podem ver apenas seus próprios leads` (`SELECT`, `to public`, `using auth.uid() = user_id`)
  - `Usuários podem deletar seus próprios leads` (`DELETE`, `to public`, `using auth.uid() = user_id`)
- `profiles`
  - `Usuários podem ver seu próprio perfil` (`SELECT`, `to public`, `using auth.uid() = id`)
  - `Usuários podem atualizar seu próprio perfil` (`UPDATE`, `to public`, `using auth.uid() = id`)

## 4) Triggers e Funcoes SQL

Evidencias atuais:

- [ ] Trigger de criacao de `profiles` para novos usuarios (nao retornou em `information_schema.triggers`; validar origem)
- [ ] Outras triggers:
- [ ] Funcoes auxiliares:

## 5) Migrations Versionadas

Padrao recomendado:

- `supabase/migrations/0001_<descricao>.sql`
- `supabase/migrations/0002_<descricao>.sql`

Checklist de implementacao/versionamento:

- [x] DDL baseline de tabelas usadas no app versionada em `supabase/migrations/0001_baseline_schema.sql`
- [x] Indices essenciais baselines versionados
- [x] Policies RLS baselines versionadas em `supabase/migrations/0002_baseline_rls.sql`
- [ ] Triggers/funcoes associadas
- [ ] Seed minima para ambiente local (opcional)

## 6) Matriz de Acesso (Resumo)

Matriz confirmada pelas policies atuais:

- `anon` pode ler: `daily_briefing`, `market_data`.
- `authenticated` pode ler: tabelas publicas e dados proprios em `profiles`/`leads` conforme policy.
- `authenticated` pode inserir: `user_analytics`, `leads` (incluindo regra de proprio usuario).
- `service_role` pode: acesso total administrativo.

## 7) Checklist de Fechamento da Lacuna

- [x] Schema baseline documentado e versionado no repositorio
- [x] RLS baseline documentado e versionado no repositorio
- [ ] Triggers/funcoes documentadas (consulta nao retornou triggers no schema `public`)
- [x] Migrations versionadas no repositorio
- [x] Revisao de seguranca concluida (RLS e policies reconciliadas com ambiente atual)

## 9) Validacao Funcional Local

- [x] Consulta de `daily_briefing` funcionando na UI (Insight do dia)
- [x] Consulta de `market_data` funcionando na UI (Painel de mercado)
- [x] Realtime do briefing configurado no cliente (assinatura de `INSERT/UPDATE`)
- [x] Consultoria funcionando na UI (`cronos-brain`)
- [x] Captura de lead funcionando

## 8) Evidencias no Codigo

- `src/hooks/useMarketFeed.ts` (leitura de `market_data`)
- `src/hooks/useDailyBriefing.ts` (leitura de `daily_briefing`)
- `src/components/DailyBriefing.tsx` (realtime `INSERT`/`UPDATE` em `daily_briefing`)
- `src/services/analyticsService.ts` (insert em `user_analytics`)
- `src/components/LeadCaptureModal.tsx` (insert em `leads`)
- `DOCUMENTACAO.md` (menciona RLS em `leads` e trigger de `profiles`)
