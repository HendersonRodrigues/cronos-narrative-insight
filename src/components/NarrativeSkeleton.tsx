import { Skeleton } from "@/components/ui/skeleton";

const NarrativeSkeleton = () => (
  <div className="space-y-6">
    {/* Narrative card skeleton */}
    <div className="rounded-xl border border-border bg-card p-5 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-28 mt-2" />
    </div>

    {/* Consultar ciclos skeleton */}
    <div className="rounded-xl border border-border bg-card p-5 md:p-8 space-y-4">
      <Skeleton className="h-4 w-28" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="h-10 w-56 rounded-full" />
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>
    </div>

    {/* Action card skeleton */}
    <div className="rounded-xl border border-border bg-card p-5 md:p-8 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-12 w-48 rounded-lg" />
    </div>

    {/* Timeline skeleton */}
    <div className="rounded-xl border border-border bg-card p-5 md:p-8 space-y-5">
      <Skeleton className="h-4 w-36" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 pl-6">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default NarrativeSkeleton;
