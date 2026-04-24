# Integracoes Realizadas no Projeto

Este documento consolida as integracoes identificadas no projeto `cronos-narrative-insight` a partir do codigo atualmente versionado.

## Status de Validacao Local

Fluxos validados manualmente em execucao local:

- [x] Insight do dia (`daily_briefing`)
- [x] Painel de mercado (`market_data`)
- [x] Consultoria inteligente (`cronos-brain`)
- [x] Captura de lead (`leads`)

## 1) Resumo Executivo

O projeto possui integracao principal com Supabase (Auth, banco e Edge Functions), React Query para orquestracao de fetch/cache no frontend e OAuth Google via Supabase Auth. Existe evidência de uso de IA por meio da Edge Function `cronos-brain`, com referencia a Mistral AI na documentacao.

## 2) Integracoes por Categoria

### 2.1 Frontend e consumo de APIs

- **Supabase JS (`@supabase/supabase-js`)**
  - **Proposito:** cliente unificado para acesso a banco, autenticacao, realtime e funcoes.
  - **Arquivos:** `src/lib/supabase.ts`, `src/config/supabaseConfig.ts`.
  - **Dependencias/chaves:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

- **TanStack React Query**
  - **Proposito:** cache, sincronizacao de estado remoto e invalidacao.
  - **Arquivos:** `src/hooks/useMarketFeed.ts`, `src/hooks/useDailyBriefing.ts`, `src/components/DailyBriefing.tsx`.

- **React Router + rota protegida**
  - **Proposito:** navegacao e controle de acesso.
  - **Arquivos:** `src/App.tsx`, `src/components/ProtectedRoute.tsx`.

### 2.2 Backend e funcoes serverless

- **Supabase Edge Function `cronos-brain`**
  - **Proposito:** processar prompts e retornar resposta de consultoria (`answer`).
  - **Arquivos de consumo no frontend:** `src/hooks/useCronosBrain.ts`, `src/pages/Index.tsx`.
  - **Como e acionada:** envio de consulta no fluxo da tela principal.
  - **Observacao:** o codigo da funcao nao esta neste repositorio.

### 2.3 Banco de dados (Supabase/Postgres)

Tabelas usadas diretamente no frontend:

- `market_data` (feed/series de mercado)
  - Arquivo principal: `src/hooks/useMarketFeed.ts`
- `daily_briefing` (briefing diario)
  - Arquivos: `src/hooks/useDailyBriefing.ts`, `src/components/DailyBriefing.tsx`
- `user_analytics` (eventos de uso)
  - Arquivo: `src/services/analyticsService.ts`
- `leads` (captura de interesse/comercial)
  - Arquivo: `src/components/LeadCaptureModal.tsx`

### 2.4 Autenticacao

- **Supabase Auth (email/senha)**
  - **Arquivos:** `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`
- **Google OAuth via Supabase**
  - **Arquivos:** `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`
  - **Observacao:** depende de configuracao do provider no painel do Supabase.

### 2.5 Persistencia local no cliente

- **LocalStorage**
  - **Proposito:** manter perfil e `session_id` local.
  - **Arquivo:** `src/hooks/useProfile.ts`
  - **Chaves observadas:** `cronos:profile`, `cronos:session_id`.

### 2.6 IA e provedores externos

- **Mistral AI**
  - **Evidencia:** mencionado na documentacao (`README.md`).
  - **Implementacao observada no repo:** indireta, por meio da chamada da Edge Function `cronos-brain`.

## 3) Fluxos de Dados Principais

### Fluxo A - Consultoria de IA

1. Usuario envia pergunta na interface.
2. Frontend registra evento em `user_analytics`.
3. Frontend invoca a Edge Function `cronos-brain`.
4. Retorno `answer` e renderizado para o usuario.

### Fluxo B - Briefing diario com atualizacao em tempo real

1. Frontend busca o registro mais recente em `daily_briefing`.
2. Canal Realtime assina `INSERT/UPDATE` nessa tabela.
3. UI e atualizada automaticamente quando ha mudanca.

### Fluxo C - Dados de mercado e painel

1. Frontend consulta `market_data`.
2. Hooks agregam/sintetizam para snapshot e visualizacoes.
3. Componentes renderizam cards/graficos de apoio.

### Fluxo D - Autenticacao e autorizacao de tela

1. Usuario autentica por email/senha ou Google OAuth.
2. Sessao e mantida pelo Supabase Auth.
3. `ProtectedRoute` libera/bloqueia rotas privadas.

### Fluxo E - Captura de lead

1. Usuario preenche formulario de interesse.
2. Frontend grava dados em `leads` no Supabase.
3. Usuario recebe feedback de sucesso/erro na UI.

## 4) Variaveis de Ambiente e Seguranca

Variaveis identificadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Estado atual:

- Configuracao movida para ambiente local via `.env` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
- Arquivo `.env.example` criado para onboarding seguro.

## 5) Lacunas de Documentacao Encontradas

- DDL/policies oficiais foram reconciliados com consultas reais do Supabase (2026-04-24).
- Contrato da Edge Function `cronos-brain` foi confirmado com codigo backend fornecido (entrada/saida/cache/secrets).
- Pendencias tecnicas remanescentes: timeout/retry e padronizacao de erros de upstream na `cronos-brain`.
- Validar divergencia de schema: `change_pct` e selecionada na funcao, mas nao apareceu no inventario de colunas de `market_data` informado.

## 6) Arquivos-Chave de Evidencia

- `src/config/supabaseConfig.ts`
- `src/lib/supabase.ts`
- `src/hooks/useCronosBrain.ts`
- `src/hooks/useMarketFeed.ts`
- `src/hooks/useDailyBriefing.ts`
- `src/components/DailyBriefing.tsx`
- `src/services/analyticsService.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/LeadCaptureModal.tsx`
- `src/pages/Index.tsx`
- `README.md`
- `DOCUMENTACAO.md`
- `docs/edge-functions/cronos-brain.md`
- `docs/database/schema-e-rls.md`
- `.env.example`
- `supabase/migrations/0001_baseline_schema.sql`
- `supabase/migrations/0002_baseline_rls.sql`

