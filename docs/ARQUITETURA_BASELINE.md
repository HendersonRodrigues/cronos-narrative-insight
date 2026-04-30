# Cronos Narrative Insight — Baseline de Arquitetura

> Documento mestre de referência para qualquer IA (ou desenvolvedor) que for trabalhar no repositório.
> Objetivo: fornecer um mapa completo da árvore de arquivos, responsabilidades, fluxos de dados, dependências entre módulos e armadilhas conhecidas — de modo que mudanças futuras sejam feitas sem quebrar contratos implícitos.
>
> Repositório: `https://github.com/HendersonRodrigues/cronos-narrative-insight.git`
> Última atualização desta baseline: 2026-04-30.

---

## 1. Visão geral do produto

Plataforma de **inteligência financeira** com estética Bloomberg/FT em dark mode. Mostra ao usuário:

- **Briefing diário** (análise macro publicada pelo admin).
- **Painel de mercado** (IBOV, DÓLAR, SELIC, IPCA — séries históricas).
- **Consultoria inteligente** (LLM via Edge Function `cronos-brain`).
- **Oportunidades de investimento** (curadas pelo admin).
- **Perfil do investidor** (conservador, moderado, arrojado) que personaliza respostas da IA.

Mobile-first absoluto. Todo footer carrega disclaimer legal (educação, não recomendação).

---

## 2. Stack e infra

| Camada | Tecnologia |
|---|---|
| UI | React 18 + Vite 5 + TypeScript 5 |
| Estilo | Tailwind v3 + shadcn/ui (tokens HSL semânticos em `index.css`) |
| Estado remoto | TanStack React Query |
| Animação | framer-motion |
| Backend | **Lovable Cloud** (Supabase: Auth + Postgres + Edge Functions + Realtime) |
| LLM | Mistral AI (via Edge Function, key em secret) |

> ⚠️ **Nunca mencionar "Supabase" para o usuário final.** Usar sempre "Lovable Cloud".

---

## 3. Árvore de arquivos comentada

### 3.1 Raiz

```
.
├── README.md
├── DOCUMENTACAO.md                  # Visão de produto e features
├── INTEGRACOES_REALIZADAS.md        # Inventário das integrações vivas
├── docs/
│   ├── ARQUITETURA_BASELINE.md      # ← este arquivo
│   ├── database/                    # SQL setup + schema/RLS docs
│   └── edge-functions/              # Contratos das edge functions
├── src/                             # Aplicação web
├── supabase/
│   ├── functions/                   # Código das Edge Functions (Deno)
│   └── migrations/                  # Migrations versionadas
├── public/                          # robots.txt, placeholder.svg
├── vite.config.ts / vitest.config.ts
├── tailwind.config.ts / index.css   # Design tokens
└── package.json
```

### 3.2 `src/` — frontend

```
src/
├── App.tsx                ← Roteador raiz: define rotas, ProtectedRoute, lazy load Admin/Profile/Oportunidades
├── main.tsx               ← Bootstrap React
├── index.css              ← Tokens HSL (cores, gradientes, sombras). NÃO usar cores hardcoded em componentes.
│
├── config/
│   └── supabaseConfig.ts  ← Lê VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
│
├── lib/
│   ├── supabase.ts        ← Cliente único Supabase (export `supabase`). Modo "noop seguro" se env faltar.
│   ├── displayName.ts     ← Resolve nome de exibição do usuário
│   ├── format.ts          ← Formatadores numéricos/data
│   └── utils.ts           ← `cn()` (clsx + tailwind-merge)
│
├── types/
│   ├── database.ts        ← FONTE DA VERDADE dos tipos de tabelas: ProfileDataRow, AppRole, UserRoleRow,
│   │                        AppQuestionRow, InvestmentOpportunityRow, DailyBriefingRow, RPC has_role.
│   └── cronos.ts          ← Tipos do domínio (MarketDataPoint, Opportunity UI, etc.)
│
├── contexts/
│   └── AuthContext.tsx    ← Provider global de Auth. Expõe { user, session, userRole, isAdmin, profileData,
│                            loading, signUp, signIn, signInWithGoogle, signOut }.
│                            isAdmin é derivado via RPC `has_role` com fallback a SELECT em `user_roles`.
│                            ⚠️ Não selecionar `role` em `profiles` (coluna removida).
│
├── components/
│   ├── ProtectedRoute.tsx        ← Gate de rota: exige sessão; opcionalmente `adminOnly`.
│   ├── ErrorBoundary.tsx         ← Boundary com `serviceName` p/ logs.
│   ├── CronosHeader.tsx          ← Header da landing
│   ├── DailyBriefing.tsx         ← Card do briefing (subscription Realtime em `daily_briefing`)
│   ├── MarketDashboard.tsx       ← Grid de MarketCards
│   ├── MarketCard.tsx            ← Card de ativo
│   ├── MarketChart.tsx           ← Gráfico (recharts)
│   ├── ProfileLens.tsx           ← Seletor de perfil (conservador/moderado/arrojado)
│   ├── ConsultoriaInteligente.tsx← Form de pergunta para IA
│   ├── ResponseDisplay.tsx       ← Renderiza resposta da IA (markdown + marcador [DETALHES])
│   ├── OpportunityCard.tsx       ← Card de oportunidade
│   ├── OpportunityCardSkeleton.tsx
│   ├── EmptyState.tsx
│   ├── LeadCaptureModal.tsx      ← Insere em `leads`
│   ├── MonetizationBanner.tsx
│   ├── FooterFeed.tsx            ← Footer com disclaimer legal obrigatório
│   │
│   ├── layout/
│   │   └── DashboardLayout.tsx   ← Shell das páginas autenticadas
│   │
│   ├── admin/
│   │   ├── SmartPasteManager.tsx ← UI do fluxo Smart-Paste:
│   │   │                           1) chama `process-admin-insight` (extrai estrutura)
│   │   │                           2) preview sandbox
│   │   │                           3) chama `save-admin-insight` (persiste em briefing OU opportunity)
│   │   ├── StaleAssetsWarning.tsx← Alerta sobre `market_data` desatualizado
│   │   └── SystemHealthBadge.tsx ← Indicador verde/vermelho via `useIntegrationHealth`
│   │
│   └── ui/                       ← shadcn primitives (não editar diretamente sem motivo forte)
│
├── hooks/
│   ├── useAdminContent.ts        ← React Query hooks p/ app_questions e investment_opportunities
│   │                               (list/create/update/delete). Centraliza invalidações.
│   ├── useCronosBrain.ts         ← Mutation que chama edge function `cronos-brain`
│   ├── useDailyBriefing.ts       ← Query + Realtime do briefing mais recente
│   ├── useMarketFeed.ts          ← Query de `market_data` (limit 1200, ordenado por date)
│   ├── useMarketSnapshot.ts      ← Reduz feed em snapshot por ativo
│   ├── useIntegrationHealth.ts   ← Lê `system_integration_logs` p/ badge de saúde
│   ├── useProfile.ts             ← Persiste perfil do investidor em localStorage (`cronos:profile`)
│   ├── use-mobile.tsx / use-toast.ts
│
├── services/
│   ├── adminService.ts           ← CRUD: listQuestions/createQuestion/...; listOpportunities/create/update/delete.
│   │                               Toda escrita depende das policies RLS (admin only).
│   ├── analyticsService.ts       ← Insere eventos em `user_analytics` (event_type, query_text, payload, profile)
│   └── integrationHealth.ts      ← logIntegrationEvent / reportIntegrationError → `system_integration_logs`
│
├── data/
│   └── opportunities.ts          ← Fallback estático (legacy; preferir tabela)
│
├── pages/
│   ├── Index.tsx        ← Landing autenticada/pública. Compõe Header + Briefing + Market + ProfileLens
│   │                      + Consultoria + ResponseDisplay + Histórico (user_analytics) + Footer.
│   ├── Auth.tsx         ← Login/cadastro email+senha e Google OAuth.
│   ├── Oportunidades.tsx← Lista oportunidades públicas. Usa adapter `mapRowToOpportunity` (DB→UI).
│   │                      Filtros: is_active=true; tolerantes a status/is_archived NULL (legado).
│   ├── Profile.tsx      ← Edição de profile (full_name, avatar_url, risk_profile, interests).
│   ├── Admin.tsx        ← Painel administrativo com abas: Perguntas, Oportunidades, Smart-Paste.
│   │                      Cria oportunidades já com status='published' e is_archived=false.
│   └── NotFound.tsx
│
├── test/   tests/                ← Vitest (calc, db, data-integrity, investment, alfaDiagnostics)
└── App.css / vite-env.d.ts
```

### 3.3 `supabase/`

```
supabase/
├── migrations/
│   ├── 0001_baseline_schema.sql           ← Schema base (profiles, market_data, daily_briefing, leads, …)
│   ├── 0002_baseline_rls.sql              ← Policies RLS de base
│   └── 20260429123444_0003_create_investment_opportunities.sql
└── functions/
    ├── cronos-brain/index.ts              ← LLM público (com cache 48h em user_analytics)
    ├── process-admin-insight/index.ts     ← Admin-only: extrai JSON estruturado de texto bruto via Mistral
    └── save-admin-insight/index.ts        ← Admin-only: persiste em daily_briefing OU investment_opportunities
```

### 3.4 `docs/`

```
docs/
├── ARQUITETURA_BASELINE.md                 ← este documento
├── database/
│   ├── schema-e-rls.md                     ← Doc consolidada de schema + RLS
│   ├── setup-user-roles.sql                ← Cria enum app_role + tabela user_roles + has_role()
│   ├── setup-app-questions-and-opportunities.sql
│   ├── setup-governance-status.sql         ← Adiciona colunas status / is_archived / summary
│   └── setup-integration-logs.sql          ← Cria system_integration_logs
└── edge-functions/
    └── cronos-brain.md                     ← Contrato (request/response, cache, secrets)
```

---

## 4. Modelo de dados (Supabase / Postgres)

| Tabela | Função | Escrita | Leitura |
|---|---|---|---|
| `profiles` | Cadastro do usuário (full_name, avatar_url, risk_profile, interests). **Sem coluna `role`.** | dono | dono |
| `user_roles` | Vínculo user_id → role (`admin`/`moderator`/`user`). Enum `public.app_role`. | service_role / admin | via RPC `has_role` |
| `market_data` | Séries de ativos (asset_id, date, value, change_pct). | ETL/admin | público autenticado |
| `daily_briefing` | Briefing macro do dia (title, content, market_sentiment, trade_setup, details_content, deep_analysis, assets_linked, status). | admin (via edge fn) | público |
| `investment_opportunities` | Oportunidades curadas (name, summary, description, return_rate, risk_level, min_investment, status, is_active, is_archived, …). | admin | público com filtros `is_active && !is_archived && status='published'` (com tolerância a NULL) |
| `app_questions` | Perguntas dinâmicas do app (text, category, order_index, is_active, status). | admin | público autenticado |
| `user_analytics` | Eventos (event_type, query_text, selected_profile, payload, user_id). Também usado como **cache** do `cronos-brain` (TTL 48h). | usuário/edge fn | dono / edge fn |
| `leads` | Captura comercial (LeadCaptureModal). | público (insert) | admin |
| `system_integration_logs` | Telemetria de integrações (service_name, status, context). | clientes via `integrationHealth.ts` | admin |
| `narratives` | Conteúdo histórico usado pela `cronos-brain` como contexto. | admin | edge fn |

### 4.1 RPC obrigatória

```sql
-- SECURITY DEFINER, evita recursão de RLS
public.has_role(_user_id uuid, _role app_role) returns boolean
```

Usada por: `AuthContext.tsx` (derivar `isAdmin`), edge functions admin (gating), policies RLS.

---

## 5. Autenticação e autorização

1. **Login**: `Auth.tsx` → `supabase.auth.signInWith…`.
2. `AuthContext` escuta `onAuthStateChange`, faz `fetchProfileData()` e `fetchUserRole()`.
3. `fetchUserRole` chama `has_role(user.id, 'admin')` em paralelo com `'moderator'`. Fallback: SELECT em `user_roles`.
4. `isAdmin` controla:
   - Item de menu Admin no `DashboardLayout`.
   - Acesso à rota `/admin` via `<ProtectedRoute adminOnly>`.
   - Permissão real é **sempre** revalidada nas Edge Functions e nas RLS policies — **nunca confiar só no client**.

⚠️ **Nunca armazenar role em localStorage/sessionStorage nem em coluna em `profiles`.** Vetor clássico de privilege escalation. Use exclusivamente `user_roles` + `has_role`.

---

## 6. Edge Functions (Deno)

Todas têm CORS expandido para incluir headers `x-supabase-client-platform*`, `x-supabase-client-runtime*` (preflight do Lovable preview).

### 6.1 `cronos-brain` — pública (autenticação opcional)
- **Input:** `{ prompt, profile, userId?, userInterests? }`
- **Cache:** consulta `user_analytics` por `(query_text, selected_profile, event_type='ai_insight')` com janela de 48h.
- **LLM:** Mistral `mistral-large-2512`, retry x2, timeout 30s.
- **System prompt:** modo educador (compliance CVM), formato `parágrafo + [DETALHES] + corpo`.
- **Persiste:** se `userId` presente, grava em `user_analytics` o payload `{ answer, user_interests }`.
- **Secrets:** `MISTRAL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### 6.2 `process-admin-insight` — admin-only
- **Input:** texto bruto + `target` (`briefing` | `opportunity`).
- **Output:** `{ summary, details_content, deep_analysis, assets_linked }`.
- **Não persiste**: devolve para preview no `SmartPasteManager`.

### 6.3 `save-admin-insight` — admin-only
- **Input:** `{ target, mode: 'create'|'update', publish, replace_id?, payload }`
- **Comportamento:** em `update`, arquiva o `replace_id` (`is_archived=true` / `status='archived'`) e insere o novo registro.
- **status final:** `published` se `publish=true`, senão `draft`.

---

## 7. Fluxos de dados (E2E)

### A) Consultoria de IA
`Index.tsx` → `useCronosBrain` → POST `cronos-brain` → (cache hit? retorna; senão LLM) → grava `user_analytics` → `ResponseDisplay` renderiza.

### B) Briefing diário
`useDailyBriefing` → SELECT `daily_briefing` (mais recente) + canal Realtime INSERT/UPDATE → `DailyBriefing.tsx` re-renderiza ao vivo.

### C) Painel de mercado
`useMarketFeed` → SELECT `market_data` (limit 1200, ordenado) → `useMarketSnapshot` agrega por asset → cards/charts. `integrationHealth.ts` registra ok/erro a cada fetch.

### D) Auth + autorização
Login → `AuthContext` → `has_role` → `isAdmin` → libera UI/rotas. Backend revalida em policies + edge fns.

### E) Smart-Paste admin
`SmartPasteManager` → `process-admin-insight` (extrai) → preview → `save-admin-insight` (cria/arquiva).

### F) Captura de lead
`LeadCaptureModal` → INSERT `leads`.

### G) CRUD de oportunidades
`Admin.tsx` (aba Oportunidades) → `useAdminContent` → `adminService` → INSERT/UPDATE em `investment_opportunities` com `status='published'`, `is_archived=false`. `Oportunidades.tsx` lê com filtros tolerantes a NULL via `mapRowToOpportunity`.

---

## 8. Variáveis de ambiente e secrets

**Frontend (`.env`)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Edge Functions (Cloud secrets)**:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-injetados)
- `MISTRAL_API_KEY` (manual)

⚠️ Nada de secret em código. `lib/supabase.ts` valida presença e loga erro sem crashar.

---

## 9. Convenções de design

- **Tema dark profundo** (Slate), accent **Emerald** para CTA.
- Tipografia: **Inter / Geist**, line-height 1.7. Títulos `slate-100`, corpo `slate-400`.
- Sempre HSL via tokens em `index.css` + `tailwind.config.ts`. **Nunca** `text-white`/`bg-black` direto.
- Estética **Bloomberg/FT** — densidade controlada, números em destaque, tabelas e badges discretos.
- Footer com disclaimer legal **obrigatório** em todas as páginas.

---

## 10. Armadilhas conhecidas (history of pain)

1. **`profiles.role` foi removido.** Selecionar essa coluna quebra `fetchProfileData` → `isAdmin` falha silenciosamente.
2. **Filtros estritos quebram legado**: em `Oportunidades.tsx`, registros antigos com `status NULL` ou `is_archived NULL` precisam de filtros `.or("status.is.null,status.eq.published")`.
3. **CORS preflight** do Lovable envia headers `x-supabase-client-*`. Toda edge function precisa permiti-los, senão "Failed to fetch".
4. **Cache do `cronos-brain`** está acoplado a `user_analytics` (janela 48h por `query_text + selected_profile`). Mudar o schema dessa tabela pode invalidar o cache silenciosamente.
5. **Privilege escalation**: nunca armazenar `isAdmin` em storage do cliente; sempre revalidar via `has_role`.
6. **shadcn `ui/`**: editar com cautela; preferir variantes via cva em wrappers próprios.
7. **Lazy routes**: `Admin`, `Profile`, `Oportunidades` são lazy — fallback `RouteFallback` em `App.tsx` deve permanecer mobile-friendly.
8. **`adapter` em `Oportunidades.tsx`**: DB usa `name/return_rate`, UI espera `title/annualReturn`. Não deletar `mapRowToOpportunity`.
9. **`opportunities.ts` (data/)** é legado — não é fonte da verdade. Fonte real é a tabela.

---

## 11. Comandos úteis

```bash
# Dev
bun install
bun dev

# Testes
bunx vitest run

# Migrations (executar no SQL editor do Lovable Cloud)
docs/database/setup-user-roles.sql
docs/database/setup-app-questions-and-opportunities.sql
docs/database/setup-governance-status.sql
docs/database/setup-integration-logs.sql

# Promover usuário a admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users where email = 'X'
on conflict (user_id, role) do nothing;
```

---

## 12. Checklist para qualquer mudança futura

Antes de mergear, verifique:

- [ ] Nenhum `select` referencia colunas removidas (`profiles.role`).
- [ ] Toda escrita admin tem RLS + checagem `has_role` na edge function.
- [ ] Edge function nova herda os mesmos `corsHeaders` (com `x-supabase-client-*`).
- [ ] Cores via tokens HSL — sem hex/rgb hardcoded.
- [ ] Footer com disclaimer presente em rotas públicas.
- [ ] Mobile-first verificado (≤ 375px).
- [ ] Sem `console.log` de secrets ou tokens.
- [ ] Tipos em `src/types/database.ts` atualizados se schema mudou.
- [ ] Migration SQL versionada em `supabase/migrations/`.
- [ ] Documento de integração atualizado (`INTEGRACOES_REALIZADAS.md`) se nova integração.

---

**Fim da baseline.** Qualquer divergência observada entre este documento e o código deve ser tratada como bug — atualize o documento OU corrija o código, nunca ignore.
