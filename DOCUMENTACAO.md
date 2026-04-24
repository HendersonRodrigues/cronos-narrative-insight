Status Atual do Projeto Cronos
Captura de Leads: Funcionando em LeadCaptureModal.tsx.

Conexão Supabase: Centralizada em src/lib/supabase.ts (variáveis em src/config/supabaseConfig.ts).

Segurança (RLS): Implementada no banco. A tabela leads exige user_id vinculado a um usuário autenticado.

Tabelas:

leads: Captura nome, whatsapp e oportunidade.

profiles: Criada e com trigger automática para novos usuários.

Infra: Deploy automático via Vercel conectado ao branch main do GitHub.
