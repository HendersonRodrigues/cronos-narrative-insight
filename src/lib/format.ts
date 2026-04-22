/**
 * Formatação centralizada para o Cronos.
 * Datas em pt-BR e valores monetários por ativo (BRL/USD/percentual).
 */

export type AssetId =
  | "ibov"
  | "dolar"
  | "selic"
  | "ipca"
  | "igpm"
  | "sp500"
  | "gold"
  | "msci"
  | "min_wage"
  | string;

export const ASSET_META: Record<
  string,
  {
    label: string;
    short: string;
    currency: "BRL" | "USD" | "PCT" | "PTS";
    locale: "pt-BR" | "en-US";
    decimals: number;
  }
> = {
  ibov: { label: "Ibovespa", short: "IBOV", currency: "PTS", locale: "pt-BR", decimals: 0 },
  dolar: { label: "Dólar Comercial", short: "USD/BRL", currency: "BRL", locale: "pt-BR", decimals: 4 },
  selic: { label: "Taxa Selic", short: "SELIC", currency: "PCT", locale: "pt-BR", decimals: 2 },
  ipca: { label: "IPCA (mensal)", short: "IPCA", currency: "PCT", locale: "pt-BR", decimals: 2 },
  igpm: { label: "IGP-M (mensal)", short: "IGP-M", currency: "PCT", locale: "pt-BR", decimals: 2 },
  sp500: { label: "S&P 500", short: "S&P 500", currency: "USD", locale: "en-US", decimals: 2 },
  gold: { label: "Ouro (spot)", short: "GOLD", currency: "USD", locale: "en-US", decimals: 2 },
  msci: { label: "MSCI World", short: "MSCI", currency: "USD", locale: "en-US", decimals: 2 },
  min_wage: { label: "Salário Mínimo", short: "SM", currency: "BRL", locale: "pt-BR", decimals: 2 },
};

export function getAssetMeta(assetId: string) {
  return (
    ASSET_META[assetId] ?? {
      label: assetId.toUpperCase(),
      short: assetId.toUpperCase(),
      currency: "PTS" as const,
      locale: "pt-BR" as const,
      decimals: 2,
    }
  );
}

export function formatValue(assetId: string, value: number): string {
  const meta = getAssetMeta(assetId);
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  };

  switch (meta.currency) {
    case "BRL":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", ...opts }).format(value);
    case "USD":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", ...opts }).format(value);
    case "PCT":
      return `${new Intl.NumberFormat("pt-BR", opts).format(value)}%`;
    case "PTS":
    default:
      return new Intl.NumberFormat("pt-BR", opts).format(value);
  }
}

export function formatDateBR(iso?: string | null): string {
  if (!iso) return "—";
  // Aceita "YYYY-MM-DD" sem timezone shift
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = onlyDate ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateLong(iso?: string | null): string {
  if (!iso) return "—";
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = onlyDate ? new Date(`${iso}T12:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous || !Number.isFinite(previous)) return null;
  return ((current - previous) / previous) * 100;
}
