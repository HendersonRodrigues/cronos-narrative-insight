import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Friendly empty-state placeholder used when the database returns no records.
 * Keeps the minimalist aesthetic with semantic tokens only.
 */
export default function EmptyState({
  icon,
  title = "Nada por aqui ainda",
  description = "Assim que houver dados disponíveis, eles aparecerão neste espaço.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-14 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-display text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
