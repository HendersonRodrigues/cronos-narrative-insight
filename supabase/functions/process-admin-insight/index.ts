/**
 * process-admin-insight
 * --------------------------------------------------------------
 * Smart-Paste do Admin: recebe um texto bruto (relatório, transcrição,
 * análise) e usa Lovable AI Gateway para extrair conteúdo estruturado:
 *   - summary           → resumo de até 4 linhas (formato Cronos)
 *   - details_content   → conteúdo após o marcador [DETALHES]
 *   - deep_analysis     → análise técnica/histórica
 *   - assets_linked     → ativos mencionados (Dólar, Selic, IPCA, IBOV, ...)
 *
 * Segurança:
 *   - Exige JWT do usuário no header Authorization.
 *   - Confere role 'admin' via RPC public.has_role(_user_id, _role).
 *   - Sem JWT válido ou sem role admin → 401/403.
 *
 * Não persiste nada: devolve o JSON estruturado para que o frontend
 * exiba um Preview Sandbox antes de qualquer save.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY_URL = "https://api.mistral.ai/v1/chat/completions";
const DEFAULT_MODEL = "mistral-large-2512"; // leve e rápido p/ extração
const MIN_TEXT_LEN = 80;
const MAX_TEXT_LEN = 12_000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const SYSTEM_PROMPT_BASE = `Você é um extrator de conteúdo financeiro para a plataforma Cronos.
Receberá um TEXTO BRUTO (relatório, análise, transcrição) e deve mapear o conteúdo
nos campos da ferramenta 'extract_admin_insight'.

REGRAS GERAIS:
- Português (Brasil). Não invente fatos: use apenas o que está no texto.
- 'details_content': Tudo que estiver após o marcador [DETALHES] no texto, se
  existir. Se não houver marcador, sintetize aqui o conteúdo de apoio (dados,
  números, contexto) que NÃO entrou no summary.
- 'deep_analysis': Análise técnica/macroeconômica completa, usando termos do
  mercado (Z-Score, DXY, curva de juros, etc.) e correlações. Se um termo
  técnico aparecer, explique brevemente entre parênteses.
- 'assets_linked': Lista de ativos canônicos mencionados, sem duplicatas.
  Use sempre os rótulos: "Dólar", "Selic", "IPCA", "Ibovespa", "S&P 500",
  "Treasuries", "DXY", "Ouro", "Bitcoin", "Petróleo". Se nenhum for citado,
  retorne lista vazia.

PROIBIDO:
- Saudações, recomendações diretas de compra/venda, especulação fora do texto.`;

const SUMMARY_RULES = {
  briefing: `- 'summary': BRIEFING DIÁRIO. Tom leve, direto, focado em acontecimentos de
  CURTO PRAZO e ideias para o dia (Day Trade). Máximo 4 linhas. Destaque o
  que move o mercado HOJE (notícia macro, dado econômico, gatilho técnico).
  Sem jargão pesado no resumo. Termine com uma frase tática rápida do tipo
  "Olho do dia: [setup/cenário]" — sem recomendação de compra ou venda.`,
  opportunity: `- 'summary': TESE DE OPORTUNIDADE. Resumo didático de até 4 linhas (Regra
  da Avó), focado em médio/longo prazo. Termine com "Ponte Tática: [estudo]"
  para indicar próximo passo de aprofundamento. Sem recomendação direta.`,
};

function buildSystemPrompt(target: "briefing" | "opportunity"): string {
  return `${SYSTEM_PROMPT_BASE}\n\nREGRA DE RESUMO:\n${SUMMARY_RULES[target]}`;
}

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "extract_admin_insight",
    description:
      "Extrai os campos estruturados de um texto bruto enviado pelo admin.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "Resumo didático de até 4 linhas em PT-BR. Sem saudações.",
        },
        details_content: {
          type: "string",
          description:
            "Conteúdo após o marcador [DETALHES] ou síntese dos dados de apoio.",
        },
        deep_analysis: {
          type: "string",
          description:
            "Análise técnica/macro completa, com jargões explicados entre parênteses.",
        },
        assets_linked: {
          type: "array",
          items: { type: "string" },
          description:
            "Ativos canônicos mencionados (ex.: Dólar, Selic, IPCA, Ibovespa).",
        },
        title: {
          type: "string",
          description:
            "Título curto (até 80 caracteres) para o card. Em briefing, use a manchete do dia. Em opportunity, o nome da tese.",
        },
        market_sentiment: {
          type: "string",
          description:
            "Sentimento de mercado em uma palavra/curta frase (ex.: 'risk-on', 'aversão', 'lateralizado'). Aplicável principalmente a briefing.",
        },
        trade_setup: {
          type: "string",
          description:
            "Setup operacional para o dia (ex.: gatilhos técnicos, suportes/resistências, eventos). Apenas para briefing.",
        },
      },
      required: ["summary", "details_content", "deep_analysis", "assets_linked"],
      additionalProperties: false,
    },
  },
} as const;

interface ExtractedInsight {
  summary: string;
  details_content: string;
  deep_analysis: string;
  assets_linked: string[];
  title?: string;
  market_sentiment?: string;
  trade_setup?: string;
}

function normalizeAssets(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const v = item.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function parseToolCall(data: unknown): ExtractedInsight | null {
  // OpenAI-compatible: choices[0].message.tool_calls[0].function.arguments
  // Pode vir como string JSON.
  // deno-lint-ignore no-explicit-any
  const choice = (data as any)?.choices?.[0];
  const toolCalls = choice?.message?.tool_calls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const raw = toolCalls[0]?.function?.arguments;
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      summary: String(parsed.summary ?? "").trim(),
      details_content: String(parsed.details_content ?? "").trim(),
      deep_analysis: String(parsed.deep_analysis ?? "").trim(),
      assets_linked: normalizeAssets(parsed.assets_linked),
      title: parsed.title ? String(parsed.title).trim() : undefined,
      market_sentiment: parsed.market_sentiment
        ? String(parsed.market_sentiment).trim()
        : undefined,
      trade_setup: parsed.trade_setup
        ? String(parsed.trade_setup).trim()
        : undefined,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    // 1) Auth: exige JWT do usuário
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ error: "Não autenticado." }, 401);
    }

    const SUPABASE_URL = getRequiredEnv("SUPABASE_URL");
    const SERVICE_ROLE = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = getRequiredEnv("LOVABLE_API_KEY");

    // Cliente com service role para validar token + checar role
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Sessão inválida." }, 401);
    }
    const userId = userData.user.id;

    // 2) Role gate
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) {
      console.error("has_role error:", roleErr.message);
      return jsonResponse({ error: "Falha ao verificar permissões." }, 500);
    }
    if (!isAdmin) {
      return jsonResponse({ error: "Acesso restrito a administradores." }, 403);
    }

    // 3) Validação do payload
    const body = await req.json().catch(() => ({}));
    const rawText =
      typeof body?.text === "string" ? body.text.trim() : "";
    if (rawText.length < MIN_TEXT_LEN) {
      return jsonResponse(
        { error: `O texto precisa ter pelo menos ${MIN_TEXT_LEN} caracteres.` },
        400,
      );
    }
    if (rawText.length > MAX_TEXT_LEN) {
      return jsonResponse(
        { error: `O texto excede o limite de ${MAX_TEXT_LEN} caracteres.` },
        400,
      );
    }

    const model =
      typeof body?.model === "string" && body.model.trim()
        ? body.model.trim()
        : DEFAULT_MODEL;

    const target: "briefing" | "opportunity" =
      body?.target === "briefing" ? "briefing" : "opportunity";

    // 4) Chamada ao Lovable AI Gateway com tool calling
    const aiRes = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(target) },
          { role: "user", content: rawText },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: {
          type: "function",
          function: { name: "extract_admin_insight" },
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("AI gateway error", aiRes.status, errText);
      if (aiRes.status === 429) {
        return jsonResponse(
          { error: "Limite de requisições da IA atingido. Tente novamente em instantes." },
          429,
        );
      }
      if (aiRes.status === 402) {
        return jsonResponse(
          { error: "Créditos da IA esgotados. Adicione fundos no workspace Lovable." },
          402,
        );
      }
      return jsonResponse({ error: "Falha no provedor de IA." }, 502);
    }

    const data = await aiRes.json();
    const extracted = parseToolCall(data);

    if (!extracted || !extracted.summary) {
      console.error("AI did not return tool call:", JSON.stringify(data));
      return jsonResponse(
        { error: "A IA não retornou conteúdo estruturado. Tente reformular o texto." },
        502,
      );
    }

    return jsonResponse({ extracted, model, target });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("process-admin-insight error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
