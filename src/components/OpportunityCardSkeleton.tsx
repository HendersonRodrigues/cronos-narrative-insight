import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder for OpportunityCard.
 * Mirrors the real card layout (header, badges, comparison bars, calculator, CTA)
 * so the perceived load feels instantaneous.
 */
export default function OpportunityCardSkeleton() {
  return (
    <article className="flex flex-col rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6 h-full">
      <div className="flex-1 space-y-5">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </header>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-12 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Comparison bars */}
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-4 min-h-[190px]">
          <Skeleton className="h-3 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="pt-2 border-t border-border/40 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </article>
  );
}
