/**
 * Display-name resolver para a UI.
 *
 * Regras (em ordem):
 *   1. full_name (tabela profiles), se existir e não estiver vazio.
 *   2. e-mail completo, se ≤ 20 caracteres.
 *   3. Caso contrário, prefixo do e-mail antes do "@".
 *   4. Fallback final: "Investidor".
 *
 * Mantemos a lógica isolada para que múltiplos componentes (Index, Header)
 * usem exatamente o mesmo critério.
 */
export function resolveDisplayName(
  fullName?: string | null,
  email?: string | null,
  fallback = "Investidor",
): string {
  const trimmedName = (fullName ?? "").trim();
  if (trimmedName) return trimmedName;

  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail) return fallback;

  if (trimmedEmail.length <= 20) return trimmedEmail;

  const prefix = trimmedEmail.split("@")[0];
  return prefix || fallback;
}
