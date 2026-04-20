# Project Memory

## Core
Cronos: dashboard de inteligência de mercado, dark mode profissional, sotaques cyan neon (--primary 190 95% 55%).
Inter (display + body), JetBrains Mono (labels). 1.7 line-height. Sem mocks: tudo do Supabase em tempo real.
Supabase externo (Cronos Project) configurado em src/config/supabaseConfig.ts. Tabelas: daily_briefing, market_data, user_analytics. Edge Function: cronos-brain com payload {message, profile} → {answer}.
Perfil (conservador/moderado/agressivo) persiste em localStorage; session_id anônimo via crypto.randomUUID.
Disclaimer educativo CVM obrigatório no rodapé.

## Memories
- [Design Direction](mem://style/design-direction) — Financial intelligence aesthetic (Bloomberg/FT style) in deep dark mode
- [Typography](mem://style/typography) — Font families, sizing, line-height, and color hierarchy
- [Project Requirements](mem://project/requirements) — Target assets, mobile-first approach, and legal disclaimers
- [Market Intelligence](mem://features/market-intelligence) — Core features: Narrative Autopsy, Strategic Action, and Cycle Timeline
- [Narrative Schema](mem://data/narrative-schema) — Data structure for financial analyses (autopsies)
