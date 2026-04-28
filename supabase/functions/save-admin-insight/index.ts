/**
 * save-admin-insight
 * --------------------------------------------------------------
 * Persiste um insight extraído pelo Smart-Paste em uma das duas
 * tabelas de destino:
 *
 *   - daily_briefing            (target = "briefing")
 *   - investment_opportunities  (target = "opportunity")
 *
 * Modos:
 *   - mode = "create"   → insere novo registro
 *   - mode = "update"   → arquiva (is_archived=true / status=archived)
 *                         o registro `replace_id` antes de inserir o novo
 *
 * Status do registro inserido:
 *   - publish=true  → status='published'
 *   - publish=false → status='draft'
 *
 * Segurança:
 *   - Exige JWT válido + role 'admin' (via has_role).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
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

interface InsightPayload {
  summary: string;
  details_content: string;
  deep_analysis: string;
  assets_linked: string[];
  // briefing extras
  title?: string;
  market_sentiment?: string;
  trade_setup?: string;
  date?: string;
  // opportunity extras
  name?: string;
  description?: string;
  return_rate?: number;
  risk_level?: string;
  category?: string;
  min_investment?: number;
}

interface SaveBody {
  target: "briefing" | "opportunity";
  mode: "create" | "update";
  replace_id?: string;
  publish?: boolean;
  insight: InsightPayload;
}

function isValidBody(b: unknown): b is SaveBody {
  if (!b || typeof b !== "object") return false;
  const x = b as Record<string, unknown>;
  if (x.target !== "briefing" && x.target !== "opportunity") return false;
  if (x.mode !== "create" && x.mode !== "update") return false;
  if (x.mode === "update" && typeof x.replace_id !== "string") return false;
  if (!x.insight || typeof x.insight !== "object") return false;
  const i = x.insight as Record<string, unknown>;
  if (typeof i.summary !== "string" || !i.summary.trim()) return false;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "Método não permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ error: "Não autenticado." }, 401);

    const SUPABASE_URL = getRequiredEnv("SUPABASE_URL");
    const SERVICE_ROLE = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Sessão inválida." }, 401);
    }
    const userId = userData.user.id;

    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) {
      console.error("has_role error:", roleErr.message);
      return jsonResponse({ error: "Falha ao verificar permissões." }, 500);
    }
    if (!isAdmin) {
      return jsonResponse(
        { error: "Acesso restrito a administradores." },
        403,
      );
    }

    const body = await req.json().catch(() => null);
    if (!isValidBody(body)) {
      return jsonResponse({ error: "Payload inválido." }, 400);
    }

    const status = body.publish ? "published" : "draft";
    const insight = body.insight;
    const todayIso = new Date().toISOString().slice(0, 10);

    // ---------------------------------------------------------------
    // BRIEFING
    // ---------------------------------------------------------------
    if (body.target === "briefing") {
      // Em "update", arquiva o anterior antes de inserir
      if (body.mode === "update" && body.replace_id) {
        const { error: archiveErr } = await admin
          .from("daily_briefing")
          .update({ status: "archived" })
          .eq("id", body.replace_id);
        if (archiveErr) {
          console.error("archive briefing error:", archiveErr.message);
          return jsonResponse(
            { error: "Falha ao arquivar briefing anterior." },
            500,
          );
        }
      }

      const insertPayload = {
        title: insight.title?.trim() || "Briefing do Dia",
        content: insight.summary,
        date: insight.date ?? todayIso,
        profile_type: "geral",
        status,
        market_sentiment: insight.market_sentiment ?? null,
        trade_setup: insight.trade_setup ?? null,
        details_content: insight.details_content ?? null,
        deep_analysis: insight.deep_analysis ?? null,
        assets_linked: insight.assets_linked ?? [],
      };

      const { data: inserted, error: insertErr } = await admin
        .from("daily_briefing")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) {
        console.error("insert briefing error:", insertErr.message);
        return jsonResponse({ error: insertErr.message }, 500);
      }

      return jsonResponse({ ok: true, target: "briefing", row: inserted });
    }

    // ---------------------------------------------------------------
    // OPPORTUNITY
    // ---------------------------------------------------------------
    if (body.target === "opportunity") {
      if (body.mode === "update" && body.replace_id) {
        const { error: archiveErr } = await admin
          .from("investment_opportunities")
          .update({ is_archived: true, status: "archived", is_active: false })
          .eq("id", body.replace_id);
        if (archiveErr) {
          console.error("archive opportunity error:", archiveErr.message);
          return jsonResponse(
            { error: "Falha ao arquivar oportunidade anterior." },
            500,
          );
        }
      }

      const insertPayload = {
        name: insight.name?.trim() || insight.title?.trim() || "Nova Oportunidade",
        description: insight.description ?? insight.summary,
        summary: insight.summary,
        return_rate: insight.return_rate ?? null,
        risk_level: insight.risk_level ?? "medio",
        category: insight.category ?? null,
        min_investment: insight.min_investment ?? null,
        is_active: body.publish ? true : false,
        is_archived: false,
        status,
        details_content: insight.details_content ?? null,
        deep_analysis: insight.deep_analysis ?? null,
        assets_linked: insight.assets_linked ?? [],
      };

      const { data: inserted, error: insertErr } = await admin
        .from("investment_opportunities")
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) {
        console.error("insert opportunity error:", insertErr.message);
        return jsonResponse({ error: insertErr.message }, 500);
      }

      return jsonResponse({ ok: true, target: "opportunity", row: inserted });
    }

    return jsonResponse({ error: "Target desconhecido." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("save-admin-insight error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
