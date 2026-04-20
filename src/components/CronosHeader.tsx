import { Activity } from "lucide-react";

export default function CronosHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container max-w-5xl mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-primary-soft">
            <Activity className="h-4 w-4 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              CRONOS
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Inteligência de Mercado
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary/80">
            Live · Cronos Brain
          </span>
        </div>
      </div>
    </header>
  );
}
