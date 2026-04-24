# Cronos Narrative Insight

Aplicacao web (React + Vite + Tailwind) com foco em analise narrativa de mercado, integracao com Supabase e camada de consultoria inteligente via Edge Function.

## Stack Principal

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Realtime, Edge Functions)
- React Query (fetch/cache no frontend)

## Como Rodar Localmente

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar variaveis de ambiente

Crie um arquivo `.env` na raiz (veja a secao "Contrato de Ambiente").

### 3) Subir ambiente de desenvolvimento

```bash
npm run dev
```

## Contrato de Ambiente

Variaveis obrigatorias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O projeto usa apenas variaveis de ambiente para credenciais Supabase. Nao versionar `.env`.

## Documentacao do Projeto

- Integracoes mapeadas: `INTEGRACOES_REALIZADAS.md`
- Documento complementar atual: `DOCUMENTACAO.md`

## Integracoes Ja Implementadas (Resumo)

- Supabase Auth (email/senha e Google OAuth)
- Supabase Database (`market_data`, `daily_briefing`, `user_analytics`, `leads`)
- Supabase Realtime (atualizacao do briefing)
- Supabase Edge Function (`cronos-brain`) para respostas de consultoria
- Analytics em tabela `user_analytics`
- Persistencia local de contexto/perfil no navegador

## Estado da Documentacao

Artefatos ja criados:

- `.env.example`
- `INTEGRACOES_REALIZADAS.md`
- `docs/edge-functions/cronos-brain.md`
- `docs/database/schema-e-rls.md`
- `supabase/migrations/0001_baseline_schema.sql`
- `supabase/migrations/0002_baseline_rls.sql`

Pendencias externas ao repositório (para fechamento 100%):

- monitorar divergencias futuras entre migrations locais e schema/policies do Supabase
- publicar a versao de referencia de `supabase/functions/cronos-brain/index.ts` no projeto Supabase
