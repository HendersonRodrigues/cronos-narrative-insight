/**
 * StaleAssetsWarning — alerta no Smart-Paste quando ativos mencionados
 * pelo Insight estão com dados desatualizados no banco.
 *
 * Considera "desatualizado" qualquer ativo cuja última leitura no
 * `market_data` seja mais antiga que `STALE_HOURS` horas — sinaliza ao
 * Head de Produção que a narrativa pode estar baseada em dados offline.
 */

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";

const STALE_HOURS = 24;

// Mapa entre nomes "humanos" mencionados pela IA e os asset_id do banco.
const ASSET_ALIASES: Record<string, string> = {
  dolar: "dolar",
  dólar: "dolar",
  usd: "dolar",
  ptax: "dolar",
  ibov: "ibov",
  ibovespa: "ibov",
  bovespa: "ibov",
  selic: "selic",
  cdi: "cdi",
  ipca: "ipca",
  inflacao: "ipca",
  inflação: "ipca",
  ouro: "gold",
  gold: "gold",
  sp500: "sp500",
  "s&p": "sp500",
  "s&p500": "sp500",
  bitcoin: "btc",
  btc: "btc",
  cripto: "btc",
  ethereum: "eth",
  eth: "eth",
};

function normalizeAsset(label: string): string | null {
  const key = label.trim().toLowerCase();
  if (ASSET_ALIASES[key]) return ASSET_ALIASES[key];
  // Tenta o fallback direto (já em formato "dolar", "ibov" etc.)
  const direct = key.replace(/[^a-z0-9]/g, "");
  return ASSET_ALIASES[direct] ?? direct ?? null;
}

interface Props {
  assetsLinked: string[];
}

export default function StaleAssetsWarning({ assetsLinked }: Props) {
  const requested = useMemo(
    () =>
      Array.from(
        new Set(
          assetsLinked
            .map((a) => normalizeAsset(a))
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [assetsLinked],
  );

  const { snapshots, isLoading } = useMarketSnapshot(requested);

  const { stale, missing, fresh } = useMemo(() => {
    const stale: { id: string; hoursAgo: number; date: string }[] = [];
    const missing: string[] = [];
    const fresh: string[] = [];

    const now = Date.now();
    for (const id of requested) {
      const snap = snapshots[id];
      if (!snap?.latest) {
        missing.push(id);
        continue;
      }
      const ts = new Date(snap.latest.date).getTime();
      const hoursAgo = (now - ts) / (1000 * 60 * 60);
      if (hoursAgo > STALE_HOURS) {
        stale.push({ id, hoursAgo, date: snap.latest.date });
      } else {
        fresh.push(id);
      }
    }
    return { stale, missing, fresh };
  }, [requested, snapshots]);

  if (requested.length === 0 || isLoading) return null;

  const hasIssue = stale.length > 0 || missing.length > 0;

  if (!hasIssue) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-500">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-wider">
          Dados de mercado atualizados ({fresh.length} ativo
          {fresh.length === 1 ? "" : "s"})
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
      <div className="flex items-center gap-2 text-amber-500">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-wider">
          Atenção: dados de mercado podem estar offline
        </span>
      </div>
      <ul className="mt-1.5 space-y-0.5 text-[11px] leading-snug text-amber-500/90">
        {stale.map((s) => (
          <li key={s.id}>
            <span className="font-mono uppercase">{s.id}</span> — última leitura há{" "}
            {Math.round(s.hoursAgo)}h ({s.date})
          </li>
        ))}
        {missing.map((m) => (
          <li key={m}>
            <span className="font-mono uppercase">{m}</span> — sem leitura
            recente no banco
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        A narrativa pode estar baseada em dados antigos. Considere atualizar
        antes de publicar.
      </p>
    </div>
  );
}
