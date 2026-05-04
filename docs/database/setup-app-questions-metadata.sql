-- =============================================================================
-- Adiciona 3 campos de metadados para envio à IA de análise
-- Execute no SQL Editor do Supabase (idempotente)
-- =============================================================================

alter table public.app_questions
  add column if not exists ai_context text,
  add column if not exists ai_objective text,
  add column if not exists ai_tone text;

comment on column public.app_questions.ai_context   is 'Contexto enviado à IA ao processar a pergunta';
comment on column public.app_questions.ai_objective is 'Objetivo da análise pretendida pela IA';
comment on column public.app_questions.ai_tone      is 'Tom esperado da resposta (ex: técnico, didático, executivo)';
