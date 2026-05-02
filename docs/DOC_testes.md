# 🧪 Documentação dos Testes — Cronos

> Localização: `src/tests/`
> Runner: **Vitest** + **React Testing Library** (jsdom)
> Setup global: `src/tests/setup.ts` (importa `@testing-library/jest-dom` e mocka `window.matchMedia`)
>
> Execução manual: `bunx vitest run`
> Execução automática: aba **Alfa** do painel `/admin` dispara `runAlfaDiagnostics` ao ser aberta.

---

## Visão geral

| Arquivo | Tipo | Cobertura |
|---|---|---|
| `setup.ts` | Bootstrap | Polyfill de `matchMedia` + matchers DOM |
| `alfaDiagnostics.ts` | Diagnóstico runtime | 8 checks Supabase + lógica (não é Vitest) |
| `example.test.ts` | Sanity | Smoke test do runner |
| `calc.test.ts` | Unitário | `pctChange` (`src/lib/format`) |
| `db.test.ts` | Smoke | Cliente Supabase carrega |
| `investment.test.ts` | Unitário | Helpers de prazo e retorno simples |
| `comprehensive.test.ts` | Unitário (amplo) | Cálculos, regex, validação, formatação, risco |
| `diagnostics.test.ts` | Unitário | Espelha as checagens da aba Alfa |
| `EmptyState.test.tsx` | Componente | `<EmptyState />` |
| `ErrorBoundary.test.tsx` | Componente | `<ErrorBoundary />` |
| `MarketCard.test.tsx` | Componente | `<MarketCard />` skeleton + variação |

---

## 1. `setup.ts`
**Função:** carregado antes de cada arquivo de teste (configurado em `vitest.config.ts`).
- Importa `@testing-library/jest-dom` (matchers `toBeInTheDocument`, `toHaveClass` etc.).
- Define `window.matchMedia` como stub para evitar `ReferenceError` em componentes que usam media queries (Sidebar, hooks responsivos).

**Esperado:** sem saída — apenas habilita o ambiente.
**Negativo (falha):** todos os testes de componente quebrariam com `matchMedia is not a function`.

---

## 2. `alfaDiagnostics.ts` (não é teste Vitest)
**Função:** rotina assíncrona executada pela aba Alfa em `/admin`. Retorna `TestResult[]` com `pass | warning | fail`.

| # | Check | Pass | Warning | Fail |
|---|---|---|---|---|
| 1 | Conexão Banco (Selic) | Encontra registro `asset_id='selic'` | Conecta mas sem dado | Erro de query/RLS |
| 2 | Acesso Público (RLS) `app_questions` | ≥1 pergunta ativa | 0 perguntas | Erro RLS bloqueia leitura |
| 3 | Lógica Extração Prazo (regex) | `\d+` casa nos 3 formatos | — | Algum formato falha |
| 4 | Acesso `investment_opportunities` | ≥1 registro | Tabela vazia | Erro acesso |
| 5 | Integridade `leads` | Tabela acessível | — | Erro acesso |
| 6 | Integridade `profiles` | Tabela acessível | Vazia/inacessível | — |
| 7 | Dados de Mercado (`market_data`) | ≥1 registro | Vazia | Erro |
| 8 | Cálculo Percentual | `pctChange(110,100)≈10` | — | Cálculo divergente |

---

## 3. `example.test.ts`
**Função:** sanity check de que o Vitest está operante.
- ✅ Pass: `expect(true).toBe(true)`.
- ❌ Fail: indica problema no runner/config.

---

## 4. `calc.test.ts`
**Função:** valida `pctChange` em `src/lib/format.ts`.
| Caso | Esperado |
|---|---|
| `pctChange(110, 100)` | ≈ **10** |
| `pctChange(90, 100)` | ≈ **-10** |
| `pctChange(100, 100)` | **0** |

❌ Falha indica regressão na fórmula de variação percentual usada por `MarketCard`/Dashboard.

---

## 5. `db.test.ts`
**Função:** smoke test do módulo `@/lib/supabase`.
- Importa dinamicamente para tolerar ausência de env em CI.
- ✅ Pass: `IS_SUPABASE_CONFIGURED` é `boolean` **OU** o erro de import contém `supabaseUrl` (env ausente).
- ❌ Fail: outro tipo de erro (módulo quebrado, export removido).

---

## 6. `investment.test.ts`
**Função:** helpers puros de oportunidade.
| Função | Caso | Esperado |
|---|---|---|
| `extractMinMonths` | `"12 - 36 meses"` | 12 |
| `extractMinMonths` | `"24 meses"` | 24 |
| `extractMinMonths` | `"Sem prazo"` | 12 (fallback) |
| `calculateReturn` | `(1000, 12, 12)` | 1120 |

❌ Falha sinaliza mudança na regra de prazo mínimo ou fórmula de juros simples exibida nos cards.

---

## 7. `comprehensive.test.ts`
**Função:** suíte ampla de regras de negócio inline.
- **Cálculos financeiros (`pctChange`):** positivo, negativo, zero=null, igualdade=0, precisão decimal.
- **Extração de número (regex):** primeiro inteiro do texto; ausência → 0.
- **Validação de e-mail:** regex simples; rejeita sem `@`, sem domínio, com espaço.
- **Formatação `R$`:** `pt-BR` com 2 casas (`R$ 1.000,00`).
- **Juros compostos:** retorno ≥ esperado em 12 e 24 meses; taxa 0% mantém principal.
- **Classificação de risco:** `<10 baixo`, `<20 medio`, `≥20 alto` (limite exato testado).

❌ Falhas indicam regressão em fórmulas, formatação de moeda ou faixas de risco.
⚠️ Observação: o teste de `pctChange(100, 0)` espera **`null`** — confirme que `format.ts` retorna `null` (e não `0`) ao dividir por zero.

---

## 8. `diagnostics.test.ts`
**Função:** espelha localmente a lógica da aba Alfa, sem rede.
- **Regex prazo:** detecta números, extrai múltiplos via `match(/\d+/g)`.
- **UUID v4-like:** valida estrutura `8-4-4-4-12`.
- **ISO date:** prefixo `YYYY-MM-DD` (não valida limites).
- **`asset_id`:** apenas `[a-z]+` (rejeita `SELIC`, `123`).
- **Percentual:** converte `"18%"` → `0.18`.
- **Datas:** `formatDate("2025-05-02")` casa `02/05/2025`.
- **Status map:** `published→Publicado`, fallback `Desconhecido`.
- **Integridade oportunidade:** id presente, nome truthy, `return_rate ≥ 0`, risco ∈ {baixo,medio,alto}.
- **Segurança:** detecta `DROP/DELETE/INSERT/UPDATE`, caracteres perigosos, `<script>`/`on*=`.
- **Limites:** `MAX_NAME_LENGTH=200`, retorno entre 0 e 1, paginação 15 itens.

❌ Falhas geralmente significam que uma constante (limite, faixa) foi alterada em produção mas não no teste.

---

## 9. `EmptyState.test.tsx`
**Componente:** `src/components/EmptyState.tsx`.
| Caso | Esperado |
|---|---|
| Render padrão | Exibe "Nada por aqui ainda" e descrição padrão |
| Props customizadas | Renderiza `title` e `description` passados |
| Prop `action` | Renderiza botão fornecido |

❌ Falha = props default alteradas ou estrutura semântica do componente quebrada.

---

## 10. `ErrorBoundary.test.tsx`
**Componente:** `src/components/ErrorBoundary.tsx`. Mocka `@/services/integrationHealth`.
- **Sem erro:** filhos renderizam normalmente.
- **Com erro (`<Bomb explode />`):** exibe `role="alert"`, texto "Falha temporária" e botão "Tentar novamente".
- **Fallback custom:** quando `fallback` é passado, ele substitui o default.
- `console.error` é silenciado para evitar ruído de logs do React.

❌ Falha indica que o boundary não captura mais o erro ou que o fallback default mudou de copy/role.

---

## 11. `MarketCard.test.tsx`
**Componente:** `src/components/MarketCard.tsx`.
| Caso | Esperado |
|---|---|
| `isLoading` sem snapshot | Renderiza ao menos um elemento `.animate-pulse` (skeleton) |
| Snapshot com `latest=110, previous=100` | Exibe variação `+10.00%` |

❌ Falha = mudança no layout do skeleton, na formatação do percentual ou no cálculo de variação do card.

---

## Como rodar

```bash
# Suite completa
bunx vitest run

# Watch durante desenvolvimento
bunx vitest

# Apenas componentes
bunx vitest run src/tests/*.test.tsx
```

Diagnósticos online: acesse `/admin` → aba **Alfa** (executa automaticamente).

---

## Convenções para novos testes

1. Salvar em `src/tests/` com sufixo `.test.ts` ou `.test.tsx`.
2. Componentes: usar `render` do `@testing-library/react`, queries por **role/text**, evitar selectors CSS frágeis.
3. Lógica pura: extrair helper para `src/lib/*` e testar a partir do import (evitar duplicar fórmulas inline).
4. Side-effects (Supabase, fetch): mockar via `vi.mock` — não bater em rede no Vitest.
5. Para nova checagem runtime, adicionar item em `alfaDiagnostics.ts` **e** espelhar em `diagnostics.test.ts`.
