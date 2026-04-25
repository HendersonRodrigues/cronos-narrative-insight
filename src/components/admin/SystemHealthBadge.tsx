/**
 * SystemHealthBadge — Health Check do painel Admin.
 *
 * Mostra o status agregado das integrações externas (Câmbio, SELIC, Cripto, etc).
 * Quando há erro, destaca a linha em vermelho com a mensagem capturada
 * (ex.: "Erro 429: Limite de requisições excedido"), sem permitir edição
 * manual — preserva a integridade da fonte original.
 */

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIntegrationHealth } from "@/hooks/useIntegrationHealth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { IntegrationHealthRow } from "@/services/integrationHealth";

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function statusTone(status: IntegrationHealthRow["status"]) {
  if (status === "error")
    return {
      label: "Falha",
      icon: AlertTriangle,
      dot: "bg-destructive",
      text: "text-destructive",
      ring: "ring-destructive/40",
    };
  if (status === "warning")
    return {
      label: "Atenção",
      icon: AlertCircle,
      dot: "bg-amber-500",
      text: "text-amber-500",
      ring: "ring-amber-500/40",
    };
  return {
    label: "Operacional",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    text: "text-emerald-500",
    ring: "ring-emerald-500/30",
  };
}

export default function SystemHealthBadge() {
  const { data, isLoading, isFetching, error } = useIntegrationHealth();
  const queryClient = useQueryClient();

  const aggregate = useMemo(() => {
    if (!data || data.length === 0) return "ok" as const;
    if (data.some((r) => r.status === "error")) return "error" as const;
    if (data.some((r) => r.status === "warning")) return "warning" as const;
    return "ok" as const;
  }, [data]);

  const errors = useMemo(
    () => (data ?? []).filter((r) => r.status === "error"),
    [data],
  );

  const tone = statusTone(aggregate);
  const Icon = tone.icon;

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group flex w-full items-center justify-between gap-3 rounded-lg border bg-card/60 px-3 py-2 text-left transition hover:bg-card/80",
              aggregate === "error"
                ? "border-destructive/50"
                : aggregate === "warning"
                  ? "border-amber-500/40"
                  : "border-border/60",
            )}
            aria-label="Status do sistema"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "relative flex h-2.5 w-2.5",
                  aggregate !== "ok" && "animate-pulse",
                )}
              >
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-60",
                    tone.dot,
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-2.5 w-2.5 rounded-full",
                    tone.dot,
                  )}
                />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Status do sistema
                </span>
                <span className={cn("text-sm font-medium", tone.text)}>
                  {isLoading ? "Verificando…" : tone.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && !isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <Icon className={cn("h-4 w-4", tone.text)} />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px] p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Diagnóstico de integrações
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["integration-health"] })
              }
              aria-label="Atualizar"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isFetching && "animate-spin",
                )}
              />
            </Button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando status…
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-xs text-destructive">
                {(error as Error).message}
              </div>
            ) : !data || data.length === 0 ? (
              <div className="px-4 py-6 text-xs text-muted-foreground">
                Nenhuma integração registrou eventos ainda. Os logs aparecem
                aqui assim que o app fizer chamadas externas.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.map((row) => {
                  const t = statusTone(row.status);
                  return (
                    <li
                      key={row.service_name}
                      className={cn(
                        "px-3 py-2.5",
                        row.status === "error" && "bg-destructive/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              t.dot,
                            )}
                          />
                          <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
                            {row.service_name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase tracking-wider",
                            t.text,
                          )}
                        >
                          {t.label}
                          {row.status_code ? ` ${row.status_code}` : ""}
                        </Badge>
                      </div>
                      {row.error_message && (
                        <p className="mt-1 text-[11px] leading-snug text-destructive/90">
                          {row.error_message}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatRelative(row.last_check)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Banner crítico — visível imediatamente se houver erro */}
      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {errors.length} integraç{errors.length === 1 ? "ão" : "ões"} com falha
            </span>
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {errors.slice(0, 3).map((row) => (
              <li
                key={row.service_name}
                className="text-[11px] leading-snug text-destructive/90"
              >
                <span className="font-mono uppercase">{row.service_name}</span>
                {row.status_code ? ` · ${row.status_code}` : ""} —{" "}
                {row.error_message ?? "erro não detalhado"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
