import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-large-2512";
const MISTRAL_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

type MistralMessage = {
  role: "system" | "user";
  content: string;
};

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimText(input: unknown, max = 500): string {
  if (typeof input !== "string") return "";
  const value = input.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function isMeaningfulPrompt(prompt: string): { ok: boolean; reason?: string } {
  const normalized = prompt.trim();
  if (!normalized) {
    return { ok: false, reason: "O conteúdo da pergunta não pode estar vazio." };
  }

  // Bloqueia entradas muito curtas
  if (normalized.length < 4) {
    return { ok: false, reason: "Digite uma pergunta mais completa para análise." };
  }

  // Bloqueia entradas só com números
  if (/^\d+$/.test(normalized.replace(/\s+/g, ""))) {
    return { ok: false, reason: "A pergunta não pode conter apenas números." };
  }

  // Bloqueia entradas com excesso de símbolos
  const symbols = normalized.match(/[^\p{L}\p{N}\s]/gu) ?? [];
  const compact = normalized.replace(/\s/g, "");
  if (compact.length > 0 && symbols.length / compact.length > 0.45) {
    return { ok: false, reason: "Texto inválido. Escreva uma pergunta em linguagem natural." };
  }

  // Requer pelo menos uma quantidade mínima de letras
  const letters = normalized.match(/\p{L}/gu) ?? [];
  if (letters.length < 4) {
    return { ok: false, reason: "Escreva uma pergunta com palavras legíveis." };
  }

  // Requer ao menos 2 palavras com 2+ letras (evita ruído tipo 'a b c')
  const words = normalized
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length >= 2 && /\p{L}/u.test(w));
  if (words.length < 2) {
    return { ok: false, reason: "Escreva uma pergunta com mais contexto." };
  }

  return { ok: true };
}

async function callMistralWithRetry(
  apiKey: string,
  messages: MistralMessage[],
): Promise<{ answer: string }> {
  let lastErrorMessage = "Erro na IA.";
  let lastStatus = 500;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MISTRAL_TIMEOUT_MS);

    try {
      const mistralRes = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 900,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await mistralRes.json().catch(() => ({}));
      const answer = data?.choices?.[0]?.message?.content;

      if (mistralRes.ok && typeof answer === "string" && answer.trim()) {
        return { answer };
      }

      lastStatus = mistralRes.status || 500;
      lastErrorMessage = data?.error?.message || "Erro na IA.";

      const retryable = mistralRes.status === 429 || mistralRes.status >= 500;
      if (!retryable || attempt === MAX_RETRIES) break;
      await sleep(300 * (attempt + 1));
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      lastStatus = isAbort ? 504 : 503;
      lastErrorMessage = isAbort
        ? "Timeout na chamada ao provedor de IA."
        : "Falha de rede ao consultar o provedor de IA.";

      if (attempt === MAX_RETRIES) break;
      await sleep(300 * (attempt + 1));
    }
  }

  if (lastStatus === 429) {
    throw new Error("RATE_LIMIT::O provedor de IA está com limite de requisições no momento.");
  }
  if (lastStatus === 503 || lastStatus === 504) {
    throw new Error("UPSTREAM_UNAVAILABLE::Provedor de IA indisponível no momento.");
  }
  throw new Error(`UPSTREAM_ERROR::${lastErrorMessage}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const userProfile = typeof body?.userProfile === "string" && body.userProfile.trim()
      ? body.userProfile.trim()
      : "Moderado";

    const validation = isMeaningfulPrompt(prompt);
    if (!validation.ok) {
      return jsonResponse({ error: validation.reason }, 400);
    }

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const mistralApiKey = getRequiredEnv("MISTRAL_API_KEY");

    // Cache por pergunta/perfil
    const { data: cacheData } = await supabase
      .from("user_analytics")
      .select("payload")
      .eq("query_text", prompt)
      .eq("selected_profile", userProfile)
      .order("created_at", { ascending: false })
      .limit(1);

    if (cacheData?.length && cacheData[0]?.payload) {
      const cachedAnswer = typeof cacheData[0].payload === "string"
        ? cacheData[0].payload
        : cacheData[0].payload.answer;

      if (typeof cachedAnswer === "string" && cachedAnswer.trim()) {
        return jsonResponse({ answer: cachedAnswer });
      }
    }

    // Evita erro por coluna inexistente (change_pct não está no schema confirmado)
    const { data: marketData, error: marketErr } = await supabase
      .from("market_data")
      .select("asset_id, value, date")
      .order("date", { ascending: false })
      .limit(15);
    if (marketErr) throw new Error(`DB_MARKET_ERROR::${marketErr.message}`);

    const { data: narratives, error: narrativesErr } = await supabase
      .from("narratives")
      .select(
        "asset_id, title, market_regime, content_historical, content_weekly, question_past_rhyme, question_realistic_view",
      )
      .limit(8);
    if (narrativesErr) throw new Error(`DB_NARRATIVES_ERROR::${narrativesErr.message}`);

    const compactMarket = (marketData ?? []).map((item) => ({
      asset_id: item.asset_id,
      value: item.value,
      date: item.date,
    }));
    const compactNarratives = (narratives ?? []).map((item) => ({
      asset_id: item.asset_id,
      title: trimText(item.title, 120),
      market_regime: trimText(item.market_regime, 180),
      content_historical: trimText(item.content_historical, 900),
      content_weekly: trimText(item.content_weekly, 600),
      question_past_rhyme: trimText(item.question_past_rhyme, 220),
      question_realistic_view: trimText(item.question_realistic_view, 220),
    }));

    const context = JSON.stringify(compactMarket);
    const historicalBase = JSON.stringify(compactNarratives);

    const systemPrompt = `Você é o Cronos Brain, estrategista financeiro de elite.
Perfil do Usuário: ${userProfile}.

DADOS ATUAIS DO MERCADO: ${context}.
BASE HISTÓRICA DE CICLOS (NARRATIVAS): ${historicalBase}.

LÓGICA DE CONSTRUÇÃO:
1. IDENTIFICAÇÃO: Compare os dados atuais com a BASE HISTÓRICA. Localize o ciclo que possui o 'market_regime' e 'content_historical' mais similar ao hoje.
2. RESUMO: Explique o conceito do tema de forma simples. Proibido usar códigos como [F24], [S08], etc. Termine com uma indicação educativa.
3. ANÁLISE PROFUNDA: Use a história para validar seu argumento.
   - NÃO cite o código (ex: [F24]). Em vez disso, descreva o período.
   - Exemplo: "O cenário atual guarda fortes rimas com o período de Ciclo Fiscal e incerteza doméstica visto anteriormente, onde a liquidez era restritiva..." (use o texto de 'content_historical').
   - Baseie sua recomendação de postura no campo 'content_weekly'.
4. PROVOCAÇÃO: Use a 'question_past_rhyme' ou 'question_realistic_view' da narrativa identificada para fechar.

DIRETRIZES DE LINGUAGEM:
- Regra da Avó: Explique conceitos complexos de forma didática no resumo.
- Tradução de Jargão: Se usar termos técnicos (ex: Z-Score, RSI), explique brevemente entre parênteses.

ESTRUTURA DE RESPOSTA (OBRIGATÓRIA):
1. RESUMO (máximo de 4 linhas): Foco Iniciante. Linguagem simples, direta.
2. MARCADOR: [DETALHES] (em uma linha isolada).
3. ANÁLISE PROFUNDA: Foco Experiente. Use termos técnicos e correlações macro.
4. Seja extremamente direto. Evite repetições.
5. Ao final da Análise Profunda, finalize com frases como: 'Clique no botão abaixo para explorar os detalhes de oportunidades descorrelacionadas e como ter maiores rentabilidades.

RESTRIÇÕES:
- Responda estritamente em Português (Brasil).
- Sem saudações. Comece direto no conteúdo.
- PROIBIDO recomendação direta de compra ou venda.
- Respeite extritamente o máximo de tokens, reduzindo a análise para caber na quantidade máxima permitida.
- Nunca, em hipotese alguma, quebre a mensagem quando chegar ao fim dos tokens, complete a mensagem dentro do limite estabelecido`;

    const { answer } = await callMistralWithRetry(mistralApiKey, [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    await supabase.from("user_analytics").insert([
      {
        query_text: prompt,
        payload: { answer },
        selected_profile: userProfile,
        event_type: "ai_insight",
      },
    ]);

    return jsonResponse({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("FUNCTION ERROR:", message);

    if (message.startsWith("RATE_LIMIT::")) {
      return jsonResponse({ error: message.replace("RATE_LIMIT::", "") }, 429);
    }
    if (message.startsWith("UPSTREAM_UNAVAILABLE::")) {
      return jsonResponse({ error: message.replace("UPSTREAM_UNAVAILABLE::", "") }, 503);
    }
    if (message.startsWith("UPSTREAM_ERROR::")) {
      return jsonResponse({ error: message.replace("UPSTREAM_ERROR::", "") }, 502);
    }
    if (message.startsWith("DB_")) {
      return jsonResponse({ error: "Falha ao consultar dados internos." }, 500);
    }

    return jsonResponse({ error: message }, 500);
  }
});
