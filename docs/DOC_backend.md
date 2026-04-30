# DOC_backend — Documentação Robusta do Backend Cronos

> Documento mestre do backend (Lovable Cloud / Postgres + Edge Functions Deno).
> Consolida o conteúdo de `Documentação_Backend.docx` e `edge_Functions.docx`
> com o estado atual do repositório (`supabase/functions/`, `src/services/`,
> `src/hooks/`, `src/types/database.ts`, `docs/database/*`).
>
> Última atualização: 2026-04-30.
> Referências: `docs/ARQUITETURA_BASELINE.md`, `docs/database/schema-e-rls.md`,
> `INTEGRACOES_REALIZADAS.md`.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│  Frontend (React + Vite)    │         │  Lovable Cloud (Supabase)        │
│                             │         │                                  │
│  hooks/  ──► supabase.from  │ ──────► │  Postgres (RLS + has_role)       │
│  hooks/  ──► functions.invk │ ──────► │  Edge Functions (Deno)           │
│                             │ ◄────── │  Realtime (daily_briefing)       │
└─────────────────────────────┘         └──────────────────────────────────┘
                                                      │
                                                      ├──► Mistral AI (LLM)
                                                      ├──► BCB / SGS
                                                      └──► Yahoo Finance
```

- Cliente único: `src/lib/supabase.ts` (chave anon publicável).
- Toda lógica privilegiada vive em **Edge Functions** com `SERVICE_ROLE_KEY`.
- Autorização sensível (admin) é validada **dentro da função** via
  `auth.getUser(token)` + RPC `has_role(user_id, 'admin')`.

---

## 2. Modelo de Dados (Postgres público)

### 2.1 Tabelas confirmadas em uso

| Tabela | Propósito | Escrita por | Leitura por |
|---|---|---|---|
| `profiles` | Metadados do usuário autenticado (nome, avatar, perfil de risco). **Não contém role**. | Trigger `handle_new_user` + próprio user | Próprio user |
| `user_roles` | Vínculo `(user_id, role)` com enum `app_role`. **Única fonte de verdade de papéis.** | Admin (via SQL/migration) | RPC `has_role` |
| `market_data` | Série histórica de ativos (`asset_id`, `date`, `value`, `meta`). Unique `(asset_id, date)`. | Edge functions de ingestão | público (anon + auth) |
| `daily_briefing` | Briefing diário publicado. `status ∈ {draft, published, archived}`. Unique `date`. | `cronos-daily-scheduler`, `save-admin-insight` | público |
| `investment_opportunities` | Curadoria de oportunidades exibidas em `/oportunidades`. Flags `is_active`, `is_archived`, `status`. | Admin via `adminService` ou `save-admin-insight` | público (filtrando ativas) |
| `narratives` | Conteúdo histórico/narrativo por ativo (input do `cronos-brain`). | Admin/seed manual | service-role (edge) |
| `app_questions` | Perguntas dinâmicas (consultoria/onboarding). Ordenadas por `order_index`. | Admin via `adminService` | autenticados |
| `user_analytics` | Eventos do usuário + cache de respostas IA. Campos: `event_type`, `query_text`, `selected_profile`, `payload`. | anon/auth (insert), `cronos-brain` | times internos |
| `leads` | Captura comercial de oportunidade. | público (insert) e dono | dono |
| `integration_logs` / view `integration_health_latest` | Telemetria de saúde das integrações externas. | edge functions (`reportIntegrationError`) | admin |

### 2.2 Enum e RPC de segurança

```sql
create type public.app_role as enum ('admin', 'moderator', 'user');

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles
                    where user_id = _user_id and role = _role) $$;
```

> ⚠️ **Nunca** ler `role` de `profiles` (coluna removida na migração de 2026-04).
> Sempre usar `has_role` no front (`AuthContext.fetchUserRole`) e no backend
> (edge functions admin).

### 2.3 RLS — políticas vigentes (resumo)

- `daily_briefing`, `market_data`: SELECT público.
- `user_analytics`: INSERT anon/public.
- `leads`: INSERT público + SELECT/DELETE pelo dono (`auth.uid() = user_id`).
- `profiles`: SELECT/UPDATE pelo dono.
- `user_roles`: leitura via `has_role` (security definer); escrita restrita a service-role.
- `investment_opportunities` / `app_questions`: SELECT público; INSERT/UPDATE/DELETE
  somente para `has_role(auth.uid(),'admin')`.

---

## 3. Inventário das Edge Functions

> Base de URL: `https://<project-ref>.supabase.co/functions/v1/<slug>`
> CORS preflight `OPTIONS` é tratado nas funções marcadas com ✅.

| Função | CORS | Auth | Persiste em | LLM/Externo | Status no repo |
|---|---|---|---|---|---|
| `cronos-brain` | ✅ | JWT no body (anon) | `user_analytics` (cache + log) | Mistral | **presente** |
| `process-admin-insight` | ✅ | JWT + `has_role('admin')` | — (preview) | Mistral (tool calling) | **presente** |
| `save-admin-insight` | ✅ | JWT + `has_role('admin')` | `daily_briefing` ou `investment_opportunities` | — | **presente** |
| `cronos-daily-scheduler` | ❌ | service-role | `daily_briefing` (upsert por `date`) | Mistral | documentado, **ausente do repo** |
| `cronos-market-fetcher` | ❌ | service-role | `market_data` (upsert `asset_id,date`) | BCB SGS, Yahoo | documentado, **ausente** |
| `cronos-fix-selic` | ✅ | service-role | `market_data` (delete+upsert SELIC) | BCB SGS 432 | documentado, **ausente** |
| `cronos-import-csv` | ✅ | service-role | `market_data` (upsert lotes 500) | — | documentado, **ausente** |
| `cronos-seed` | ❌ | service-role | `market_data` (upsert lotes 400) | BCB SGS, Yahoo | documentado, **ausente** |
| `rapid-worker` | ❌ | nenhuma | — | — | placeholder |

> ⚠️ As funções de ingestão de mercado existem **deployadas no projeto Supabase**
> (conforme `Documentação_Backend.docx`) mas **não estão versionadas** em
> `supabase/functions/`. Ver §8 (melhorias).

### 3.1 `cronos-brain` — Consultoria IA

- **Entrada**: `{ prompt, userProfile?, userId?, userInterests? }`.
- **Validação**: heurística `isMeaningfulPrompt` (mín. 4 letras, ≥2 palavras,
  proporção de símbolos < 45%).
- **Cache global de 48h** em `user_analytics` por `(query_text, selected_profile, event_type='ai_insight')`.
- **Contexto**: `market_data` (15 últimas linhas) + `narratives` (8).
- **LLM**: Mistral `mistral-large-2512`, `temperature=0.2`, `max_tokens=1100`,
  retry exponencial (até 2x) em 429/5xx, timeout 30s.
- **Persistência**: insere em `user_analytics` com `event_type='ai_insight'`.
- **Saída**: `{ answer, cached?: true }`.

### 3.2 `process-admin-insight` — Smart-Paste (extração)

- **Auth**: exige Bearer JWT + `has_role('admin')`.
- **Entrada**: `{ text, target: 'briefing'|'opportunity', model? }` (80–12000 chars).
- **Mecanismo**: Mistral com **tool calling** (`extract_admin_insight`) → JSON tipado:
  `summary`, `details_content`, `deep_analysis`, `assets_linked` + extras por target.
- **Não persiste**: devolve preview para o frontend exibir Sandbox.

### 3.3 `save-admin-insight` — Persistência editorial

- **Auth**: JWT + admin.
- **Entrada**: `{ target, mode: 'create'|'update', replace_id?, publish?, insight }`.
- **Comportamento**:
  - `mode=update` arquiva o `replace_id` (`status='archived'`, em opportunity também `is_archived=true, is_active=false`).
  - Insere novo registro com `status = publish ? 'published' : 'draft'`.
- **Saída**: `{ ok: true, target, row }`.

### 3.4 Funções de ingestão (documentadas)

| Função | Janelas/Fonte | Particularidades |
|---|---|---|
| `cronos-seed` | BCB SGS 11/433/189/22099/24363/1619 + Yahoo (1wk) | Lotes 400; gold = close × 10 |
| `cronos-market-fetcher` | SGS 432/433/22099/24363 + Yahoo (5d, 1d) | Upsert deduplicado |
| `cronos-fix-selic` | SGS 432 em 3 janelas (2006-2012, 2013-2019, 2020-hoje) | `delete` antes do upsert |
| `cronos-import-csv` | `raw_csv` ou `manual_data` | Aceita `;`/`,`, normaliza datas BR |
| `cronos-daily-scheduler` | `market_data` + Mistral | `upsert daily_briefing on conflict (date)` |

---

## 4. Relação Frontend ↔ Backend

### 4.1 Mapa de hooks/serviços por tabela / função

| Camada front | Arquivo | Acessa | Operação |
|---|---|---|---|
| Auth/role | `contexts/AuthContext.tsx` | `profiles` (SELECT), RPC `has_role`, fallback `user_roles` | login, refresh |
| Briefing | `hooks/useDailyBriefing.ts`, `components/DailyBriefing.tsx` | `daily_briefing` (SELECT `status='published'`) + Realtime INSERT/UPDATE | leitura |
| Mercado | `hooks/useMarketFeed.ts`, `useMarketSnapshot.ts` | `market_data` | leitura série |
| IA | `hooks/useCronosBrain.ts` → edge `cronos-brain` | `user_analytics` (indireto) | mutation |
| Admin Smart-Paste | `components/admin/SmartPasteManager.tsx` → edges `process-admin-insight` + `save-admin-insight` | `daily_briefing`/`investment_opportunities` | extract + save |
| Admin CRUD | `services/adminService.ts` | `app_questions`, `investment_opportunities` | list/create/update/delete |
| Oportunidades | `pages/Oportunidades.tsx` | `investment_opportunities` (filtros tolerantes a `null`) | leitura |
| Leads | `components/LeadCaptureModal.tsx` | `leads` (INSERT) | conversão |
| Analytics | `services/analyticsService.ts` | `user_analytics` | fire-and-forget |
| Saúde | `hooks/useIntegrationHealth.ts`, `services/integrationHealth.ts` | view `integration_health_latest` | Admin dashboard |

### 4.2 Fluxos E2E

**Consultoria IA**
1. UI captura `prompt` + `profile` + `interests` → `useCronosBrain.invokeBrain`.
2. `supabase.functions.invoke('cronos-brain')` com `Bearer ANON`.
3. Edge valida prompt → busca cache 48h → se miss, busca contexto + chama Mistral → grava `user_analytics`.
4. Resposta exibida em `ResponseDisplay`.

**Editorial Admin (Smart-Paste)**
1. Admin cola texto → `SmartPasteManager` → POST `process-admin-insight` (JWT + admin).
2. Preview Sandbox renderiza JSON estruturado.
3. Admin escolhe `create`/`update` + `publish` → POST `save-admin-insight`.
4. Linha aparece em `daily_briefing` ou `investment_opportunities`.
5. Realtime entrega a atualização para `DailyBriefing` no front.

**Ingestão de mercado** (cron externo / agendado)
1. `cronos-market-fetcher` (ou `cronos-seed`/`cronos-fix-selic`) chamado por scheduler.
2. Fetch BCB SGS / Yahoo → normaliza → upsert `market_data` `(asset_id,date)`.
3. UI consome via `useMarketFeed` (TanStack Query, `staleTime` ~5min).

---

## 5. Inventário de CRUDs

### 5.1 `daily_briefing`
- **Create**: `save-admin-insight` (mode=create) e `cronos-daily-scheduler` (upsert).
- **Read**: front via `useDailyBriefing` (`status='published'`, ordem por `date desc`).
- **Update**: `save-admin-insight` (mode=update arquiva anterior).
- **Delete**: não exposto (preferir arquivamento).

### 5.2 `investment_opportunities`
- **Create**: `adminService.createOpportunity` ou `save-admin-insight`.
- **Read**: `pages/Oportunidades.tsx` (`is_active=true` + tolerância a `is_archived`/`status` nulos).
- **Update**: `adminService.updateOpportunity`, `toggleOpportunityActive`, `save-admin-insight` (arquivamento).
- **Delete**: `adminService.deleteOpportunity` (raro; preferir arquivar).

### 5.3 `app_questions`
- **Create/Toggle/Delete**: `adminService` (RLS exige admin).
- **Read**: front lista por `order_index`, filtra `is_active=true`.

### 5.4 `market_data`
- **Create/Upsert**: edges de ingestão (`asset_id,date` unique).
- **Read**: público; `useMarketFeed`/`useMarketSnapshot`.
- **Delete**: somente `cronos-fix-selic` (limpeza pontual).

### 5.5 `user_analytics`
- **Create**: `analyticsService` (eventos UI) + `cronos-brain` (cache).
- **Read**: edge `cronos-brain` (cache 48h).

### 5.6 `leads`
- **Create**: `LeadCaptureModal` (anon/auth).
- **Read/Delete**: dono (RLS `auth.uid() = user_id`).

### 5.7 `user_roles`
- **Create**: SQL admin / migration / `docs/database/setup-user-roles.sql`.
- **Read**: somente via RPC `has_role` (não exposto ao front).

---

## 6. Integrações de API

| Integração | Onde | Chave/Secret | Tratamento |
|---|---|---|---|
| **Mistral AI** | `cronos-brain`, `process-admin-insight`, `cronos-daily-scheduler` | `MISTRAL_API_KEY` | Timeout 30s, retry exponencial (2x) em 429/5xx, logs `[cronos-brain]` |
| **BCB / SGS** | `cronos-seed`, `cronos-market-fetcher`, `cronos-fix-selic` | pública | parsing pt-BR (vírgula decimal, dd/mm/aaaa) |
| **Yahoo Finance** | `cronos-seed`, `cronos-market-fetcher` | pública | valida `content-type=application/json`; `gold = close × 10` |
| **Realtime Supabase** | `DailyBriefing.tsx` | anon | canal `daily_briefing` (INSERT/UPDATE) |
| **Lovable Cloud Auth** | `AuthContext` | `VITE_SUPABASE_ANON_KEY` | sessão persistida, refresh automático |

Todas as integrações registram falhas via `reportIntegrationError(service, error, meta)` →
`integration_logs` → view `integration_health_latest` → `useIntegrationHealth` no Admin.

---

## 7. Tratamento de Dados

- **Datas**: persistidas em ISO `YYYY-MM-DD` (`market_data.date`, `daily_briefing.date`).
- **Valores monetários**: `numeric` no banco; no front formatados via `lib/format.ts`.
- **Dedupe**: `market_data (asset_id, date)` unique; `daily_briefing.date` unique.
- **Versionamento editorial**: arquivamento (`status='archived'`) em vez de delete.
- **Cache IA**: chave `(query_text, selected_profile, event_type)` com TTL 48h.
- **Validação de prompt** server-side (`isMeaningfulPrompt`) e payload (`isValidBody`).
- **CORS**: `Access-Control-Allow-Origin: *` + headers Supabase em todas as edges expostas ao browser.
- **Erros**: front converte erro de edge em `toast` amigável (`useCronosBrain`,
  `SmartPasteManager`); fallback genérico se body não for JSON.

---

## 8. Diagnóstico e Melhorias Recomendadas

### 8.1 Inconsistências confirmadas

1. **Edge functions ausentes do repositório**: `cronos-brain` e Smart-Paste estão
   em `supabase/functions/`, mas `cronos-seed`, `cronos-market-fetcher`,
   `cronos-fix-selic`, `cronos-import-csv`, `cronos-daily-scheduler` e
   `rapid-worker` **não estão versionadas**. Risco: deploy sem rastreabilidade.
   → **Ação**: importar o código atual do projeto Supabase para `supabase/functions/<nome>/index.ts` e fixar via migration.

2. **`cronos-brain` aceita `userId` no body** (não valida JWT).
   → **Ação**: extrair `userId` do JWT via `auth.getUser(token)` para evitar
   spoofing de analytics.

3. **`profiles.role` removido**, mas `ProfileDataRow` em `src/types/database.ts`
   ainda lista `role?: string | null`. → remover o campo do tipo.

4. **`cronos-seed` usa SGS code 11 para SELIC**, enquanto `cronos-fix-selic` usa
   SGS 432 (correto = SELIC Meta). → padronizar em 432.

5. **`narratives`** é consultada por `cronos-brain` mas não há RLS/SQL
   versionados em `docs/database/`. → criar `setup-narratives.sql` e migration.

6. **Realtime**: o front escuta `daily_briefing` por INSERT/UPDATE; verificar se
   a publicação `supabase_realtime` inclui essa tabela.

### 8.2 Segurança — checklist

- [x] RLS habilitado nas tabelas sensíveis.
- [x] `has_role` é `security definer` com `search_path = public` (evita escalação).
- [x] Roles em tabela dedicada (`user_roles`) — sem `profiles.role`.
- [x] Edges admin validam JWT + role no servidor.
- [ ] **`cronos-brain`**: validar JWT do usuário e ignorar `userId` do body.
- [ ] Adicionar **rate limit** (por IP/JWT) em `cronos-brain` e Smart-Paste.
- [ ] Forçar **`verify_jwt = true`** em edges admin no `supabase/config.toml` (defesa em profundidade).
- [ ] Sanitizar `assets_linked` (array de strings curtas) antes do insert.
- [ ] Auditoria: registrar `author_id = auth.uid()` em `daily_briefing`/`investment_opportunities` (campos já existem).

### 8.3 Melhorias de arquitetura

- **Migrations versionadas** para `narratives`, `integration_logs`, `app_questions`.
- **Schema TS gerado** (`supabase gen types typescript`) substituindo o
  `database.ts` manual — evita drift como no caso `profiles.role`.
- **Cron declarativo** (Supabase scheduled functions) para `cronos-daily-scheduler`
  e `cronos-market-fetcher` em vez de chamadas externas.
- **Observabilidade**: enriquecer `integration_logs` com `latency_ms` e `status_code`.
- **Backoff configurável** em Mistral (`MAX_RETRIES`, `MISTRAL_TIMEOUT_MS` via env).
- **Tipos compartilhados** entre edge e front para os payloads do Smart-Paste.

---

## 9. Referências cruzadas

- `docs/ARQUITETURA_BASELINE.md` — visão de produto e árvore de arquivos.
- `docs/database/schema-e-rls.md` — RLS e dicionário detalhado.
- `docs/database/setup-user-roles.sql` — bootstrap do RBAC.
- `docs/edge-functions/cronos-brain.md` — contrato detalhado da IA.
- `INTEGRACOES_REALIZADAS.md` — histórico de integrações.
- `supabase/functions/{cronos-brain,process-admin-insight,save-admin-insight}/index.ts` — código vivo.

---

> **Próximo passo recomendado**: versionar as edges de ingestão ausentes
> (item 8.1.1) e endurecer `cronos-brain` (item 8.2). Isso fecha a baseline
> backend e elimina os dois maiores vetores de risco identificados.
