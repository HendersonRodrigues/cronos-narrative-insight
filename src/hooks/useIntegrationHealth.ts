import { useQuery } from "@tanstack/react-query";
import { fetchIntegrationHealth, type IntegrationHealthRow } from "@/services/integrationHealth";

/**
 * Consome a view `integration_health_latest` (último status por serviço).
 * Atualiza a cada 30s para o Admin ter visão quase em tempo real.
 */
export function useIntegrationHealth() {
  return useQuery<IntegrationHealthRow[]>({
    queryKey: ["integration-health"],
    queryFn: fetchIntegrationHealth,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
