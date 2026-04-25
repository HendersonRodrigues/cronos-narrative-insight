import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportIntegrationError } from "@/services/integrationHealth";

interface Props {
  children: ReactNode;
  /** Nome do serviço/contexto reportado ao integration_logs. */
  serviceName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * ErrorBoundary global. Quando uma árvore de componentes quebra:
 *  - registra o erro em `integration_logs` (categoria UI)
 *  - exibe um Empty State amigável com botão de retry
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Fire-and-forget: nunca propaga falha do logger
    void reportIntegrationError(this.props.serviceName ?? "ui:react", error, {
      context: { component_stack: info.componentStack ?? null },
    });
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] capturado:", error, info);
  }

  reset = () => this.setState({ hasError: false, message: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-5"
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            Falha temporária
          </span>
        </div>
        <p className="text-sm text-foreground/90">
          Não foi possível renderizar este bloco. Já registramos o problema para a equipe.
        </p>
        {this.state.message && (
          <code className="block w-full overflow-x-auto rounded bg-background/50 p-2 font-mono text-[11px] text-muted-foreground">
            {this.state.message}
          </code>
        )}
        <Button size="sm" variant="outline" onClick={this.reset} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
