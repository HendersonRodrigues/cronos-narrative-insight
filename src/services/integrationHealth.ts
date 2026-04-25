/**
 * integrationHealth — registra e consulta o status das integrações externas.
 *
 * Filosofia:
 *  - Frontend grava falhas (e sucessos opcionais) ao detectar problemas em
 *    fetches críticos (mercado, briefing, IA, etc.).
 *  - Admin consome a view `integration_health_latest` para o Health Check.
 *  - Nunca lança exceção — o logger é "fire-and-forget" para não amplificar
 *    falhas em cascata.
 */

import { supabase } from "@/lib/supabase";

export type IntegrationStatus = "ok" | "warning" | "error";

export interface IntegrationLogInput {
  service_name: string;
  status?: IntegrationStatus;
  status_code?: number | null;
  error_message?: string | null;
  context?: Record<string, unknown> | null;
}

export interface IntegrationHealthRow {
  service_name: string;
  status: IntegrationStatus;
  status_code: number | null;
  error_message: string | null;
  context: Record<string, unknown> | null;
  last_check: string;
}

/**
 * Registra um evento de saúde de uma integração.
 * Nunca lança — falhas de logging são engolidas (com console.warn).
 */
export async function logIntegrationEvent(input: IntegrationLogInput): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("integration_logs").insert({
      service_name: input.service_name,
      status: input.status ?? "error",
      status_code: input.status_code ?? null,
      error_message: input.error_message ?? null,
      context: input.context ?? null,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[integrationHealth] falha ao registrar log:", e);
  }
}

/**
 * Helper conveniente para reportar erro a partir de um catch.
 */
export function reportIntegrationError(
  serviceName: string,
  error: unknown,
  extras?: { status_code?: number | null; context?: Record<string, unknown> | null },
) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";
  return logIntegrationEvent({
    service_name: serviceName,
    status: "error",
    status_code: extras?.status_code ?? null,
    error_message: message,
    context: extras?.context ?? null,
  });
}

/**
 * Última leitura por serviço — usada pelo Health Check do Admin.
 */
export async function fetchIntegrationHealth(): Promise<IntegrationHealthRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("integration_health_latest")
    .select("*")
    .order("last_check", { ascending: false });
  if (error) throw error;
  return (data as IntegrationHealthRow[] | null) ?? [];
}
