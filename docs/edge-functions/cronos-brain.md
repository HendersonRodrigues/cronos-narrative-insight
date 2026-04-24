# Edge Function - `cronos-brain`

Documento de contrato tecnico da Edge Function usada no fluxo de consultoria inteligente.

Status: **consolidado com codigo backend da funcao** (fornecido em 2026-04-24).

Implementacao de referencia com correcoes aplicada no repositorio em:

- `supabase/functions/cronos-brain/index.ts`

## 1) Objetivo

Receber uma consulta textual do usuario e devolver uma resposta narrativa para exibicao na interface (`answer`). A funcao e acionada no fluxo de "consultoria inteligente" e precisa manter compatibilidade estrita com o formato esperado no frontend.

## 2) Responsabilidades

- [x] Receber payload de consulta do frontend
- [x] Enriquecer contexto com dados de mercado (`market_data`) e base historica (`narratives`)
- [x] Chamar provedor de IA (Mistral Chat Completions)
- [x] Retornar resposta no formato esperado pela UI (`{ "answer": "..." }`)
- [x] Tratar erros com payload JSON (`{ "error": "..." }`)
- [x] Aplicar cache de resposta por pergunta/perfil em `user_analytics`

## 3) Endpoint e Metodo

- **Function name:** `cronos-brain`
- **Metodo HTTP:** `POST`
- **Autenticacao:** headers `Authorization: Bearer <SUPABASE_ANON_KEY>` e `apikey: <SUPABASE_ANON_KEY>` enviados no cliente
- **CORS:** `*` com preflight `OPTIONS` retornando `ok`

## 4) Contrato de Entrada

Schema confirmado no backend:

```json
{
  "prompt": "string",
  "userProfile": "conservador | moderado | agressivo"
}
```

Campos de entrada:

- `prompt` (string, obrigatorio): pergunta do usuario
- `userProfile` (string, obrigatorio): perfil selecionado no app

## 5) Contrato de Saida (Sucesso)

Schema validado no frontend:

```json
{
  "answer": "string"
}
```

Campos de saida:

- `answer` (string obrigatorio): texto exibido na UI, vindo de `data.choices[0].message.content`
- Outros campos sao ignorados pelo frontend
- O user_id será gravado na tabela

## 6) Contrato de Erro

Formato de erro implementado:

```json
{
  "error": "string",
  "code": "string",
  "details": "string"
}
```

Mapeie:

- [x] 400 - payload invalido (`prompt` vazio)
- [x] 401/403 - auth/permissoes (ja houve caso de 401 sem headers corretos)
- [ ] 429 - limite/rate limit (nao tratado explicitamente)
- [x] 500 - erro interno (`catch` geral)
- [ ] 502/503 - falha no provedor externo de IA (nao mapeado explicitamente, cai no `500`)

## 7) Variaveis e Segredos Necessarios

Secrets confirmados no codigo:

- [x] `SUPABASE_URL` (cliente server-side da funcao)
- [x] `SUPABASE_SERVICE_ROLE_KEY` (acesso a tabelas `user_analytics`, `market_data`, `narratives`)
- [x] `MISTRAL_API_KEY` (autenticacao na API Mistral)
- [ ] Outros: nao identificado no codigo fornecido

## 8) Dependencias Externas

Detalhes confirmados:

- **Provedor IA:** Mistral (`/v1/chat/completions`)
- **Modelo:** `mistral-large-2512`
- **Parametros:** `temperature: 0.2`, `max_tokens: 1200`
- **Timeout padrao:** nao implementado explicitamente
- **Politica de retry:** nao implementada
- **Fallback:** cache local em `user_analytics`; em erro, retorno `{ error: ... }`

## 8.1) Fluxo de Cache

1. Busca em `user_analytics` por (`query_text = prompt`, `selected_profile = userProfile`), ordenado por `created_at desc`.
2. Se encontrar `payload`, retorna `payload.answer` (ou o proprio payload se for string).
3. Se nao encontrar, gera resposta via Mistral e persiste novo registro em `user_analytics` com:
   - `query_text`
   - `payload: { answer }`
   - `selected_profile`
   - `event_type: 'ai_insight'`

## 9) Observabilidade

Estado atual:

- [ ] Correlation/request id
- [x] Logs simples (`console.log` e `console.error`)
- [ ] Latencia total e por etapa
- [ ] Taxa de erro por tipo

## 10) Checklist de Pronto

- [x] Contrato de entrada/saida validado com frontend
- [x] Chamada da funcao validada em execucao local (retorno de `answer` na UI)
- [x] Secrets documentados e configurados (conforme codigo backend informado)
- [x] Dependencia de IA documentada (Mistral + parametros)
- [x] Testes de smoke executados (fluxo funcional validado localmente)
- [ ] Erros padronizados e cobertos (falta mapear 429/5xx com codigos dedicados)

## 11) Pontos de Atencao Identificados

- A query de `market_data` seleciona `change_pct`, coluna que nao apareceu no levantamento de schema informado; validar no banco para evitar falha de select.
- A funcao nao define timeout/retry de rede para chamada externa da Mistral.
- O `catch` retorna apenas status `500`; pode evoluir para mapear status de upstream (ex: 429/503).

## 12) Correcoes Aplicadas na Versao de Referencia

- Remocao de `change_pct` da query de `market_data` para aderencia ao schema confirmado.
- Timeout explicito na chamada Mistral (`15s`) com `AbortController`.
- Retry com backoff para falhas transientes (429/5xx/rede).
- Mapeamento de erros para status dedicados (`429`, `502`, `503`, `504` via fluxo interno).
