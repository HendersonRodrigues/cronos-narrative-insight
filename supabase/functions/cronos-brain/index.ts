import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  if (!normalized) return { ok: false, reason: "O conteúdo da pergunta não pode estar vazio." };
  if (normalized.length < 4) return { ok: false, reason: "Digite uma pergunta mais completa para análise." };
  if (/^\d+$/.test(normalized.replace(/\s+/g, ""))) return { ok: false, reason: "A pergunta não pode conter apenas números." };
  
  const symbols = normalized.match(/[^\p{L}\p{N}\s]/gu) ?? [];
  const compact = normalized.replace(/\s/g, "");
  if (compact.length > 0 && symbols.length / compact.length > 0.45) return { ok: false, reason: "Texto inválido. Escreva uma pergunta em linguagem natural." };
  
  const letters = normalized.match(/\p{L}/gu) ?? [];
  if (letters.length < 4) return { ok: false, reason: "Escreva uma pergunta com palavras legíveis." };

  const words = normalized.split(/\s+/).filter(w => w.length >= 2);
  if (words.length < 2) return { ok: false, reason: "Escreva uma pergunta com mais contexto." };

  return { ok: true };
}

async function callMistralWithRetry(apiKey: string, messages: MistralMessage[]): Promise<{ answer: string }> {
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
          max_tokens: 1100,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await mistralRes.json().catch(() => ({}));
      const answer = data?.choices?.[0]?.message?.content;

      if (mistralRes.ok && typeof answer === "string" && answer.trim()) return { answer };

      lastStatus = mistralRes.status || 500;
      lastErrorMessage = data?.error?.message || "Erro na IA.";

      if (!(mistralRes.status === 429 || mistralRes.status >= 500) || attempt === MAX_RETRIES) break;
      await sleep(300 * (attempt + 1));
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      lastStatus = isAbort ? 504 : 503;
      lastErrorMessage = isAbort ? "Timeout na chamada." : "Falha de rede.";
      if (attempt === MAX_RETRIES) break;
      await sleep(300 * (attempt + 1));
    }
  }
  throw new Error(`UPSTREAM_ERROR::${lastErrorMessage}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const userId = body?.userId;
    
    // Normalização do perfil para minúsculas e captura flexível de campos
    const rawProfile = body?.profile || body?.userProfile || "moderado";
    const userProfile = rawProfile.toLowerCase().trim();

    const validation = isMeaningfulPrompt(prompt);
    if (!validation.ok) return jsonResponse({ error: validation.reason }, 400);

    const supabase = createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const mistralApiKey = getRequiredEnv("MISTRAL_API_KEY");

    // Cache Global de 48h
    const CACHE_TTL_HOURS = 48;
    const thresholdDate = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { data: cacheData, error: cacheError } = await supabase
      .from("user_analytics")
      .select("payload")
      .eq("query_text", prompt)
      .eq("selected_profile", userProfile) // Usa a variável normalizada
      .eq("event_type", "ai_insight")
      .gt("created_at", thresholdDate)
      .order("created_at", { ascending: false })
      .limit(1);

    if (cacheData?.length && cacheData[0]?.payload) {
      const cachedAnswer = typeof cacheData[0].payload === "string" 
        ? cacheData[0].payload 
        : cacheData[0].payload.answer;
        
      if (cachedAnswer) {
        return jsonResponse({ answer: cachedAnswer, cached: true });
      }
    }

    const { data: marketData } = await supabase.from("market_data").select("asset_id, value, date").order("date", { ascending: false }).limit(15);
    const { data: narratives } = await supabase.from("narratives").select("asset_id, title, market_regime, content_historical, content_weekly, question_past_rhyme, question_realistic_view").limit(8);

    const context = JSON.stringify(marketData ?? []);
    const historicalBase = JSON.stringify((narratives ?? []).map(n => ({
      ...n,
      content_historical: trimText(n.content_historical, 900)
    })));

  const systemPrompt = `You are Cronos Brain, a Senior Investment Strategist. Your profile: ${userProfile}. 
Data: ${context}. History: ${historicalBase}.

STRICT COMPLIANCE & OPERATIONAL RULES:
1. CVM COMPLIANCE: Act ONLY as an educator. No buy/sell recommendations. Use "Study/Analysis" instead of "Indication".
2. HOOK CONSTRAINT: ONE paragraph (max 3 lines). MUST end with a relevant tip for a beginner investor.
3. MARKER: After the first paragraph, print exactly "[DETALHES]" in a standalone line.
4. INTEGRATED GLOSSARY: Explain technical terms in parentheses immediately—e.g. "Duration (sensibilidade do preço)".
5. OUTPUT FORMAT: Respond ONLY with plain text and Markdown. Do NOT use JSON brackets {} or labels like [HOOK]/[ANALYSIS].
6. TOKEN SAFETY: Max 420 words. If near the limit, prioritize finishing the "Tactical Roadmap" and closing the text with a period.

STRUCTURE:
- Intro Paragraph + Beginner Tip.
- [DETALHES]
- Body: Narrative connecting current data to historical cycles (rhymes) + 1 Comparative Table.
- Strategy: Explain the value of non-correlated assets (ativos descorrelacionados) to instigate study.
- Tactical Roadmap: 3 study topics to end the message.

Respond in PORTUGUESE. Ensure all Markdown tags are closed.`;
  

    const { answer } = await callMistralWithRetry(mistralApiKey, [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    await supabase.from("user_analytics").insert([{
      user_id: userId,
      query_text: prompt,
      payload: { answer },
      selected_profile: userProfile, // Salva o perfil normalizado em minúsculas
      event_type: "ai_insight",
    }]);

    return jsonResponse({ answer });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
